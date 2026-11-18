-- Kind moves from the questionnaire to the host (session), so one questionnaire can run as a
-- pre-test and later as a post-test and the two can be compared. Standard is removed.
-- Every existing session keeps the kind its questionnaire had; no rows use 'standard'.

-- 1. New type and column, filled from the questionnaire.
create type session_kind as enum ('pretest', 'posttest');

alter table public.sessions add column kind session_kind;

update public.sessions s
   set kind = qn.kind::text::session_kind
  from public.questionnaires qn
 where qn.id = s.questionnaire_id;

alter table public.sessions alter column kind set not null;

-- Hosts can update their sessions through RLS, so the database keeps kind fixed.
create function public.block_session_kind_change() returns trigger
language plpgsql set search_path = public as $$
begin
  raise exception 'Kind cannot change once a host is created';
end $$;

create trigger sessions_block_kind_change
  before update of kind on public.sessions
  for each row when (old.kind is distinct from new.kind)
  execute function public.block_session_kind_change();

-- 2. The questionnaire kind lock is no longer needed.
drop trigger questionnaires_block_kind_change on public.questionnaires;
drop function public.block_kind_change();

-- 3. create_session takes the kind.
drop function public.create_session(bigint);

create function public.create_session(p_questionnaire_id bigint, p_kind session_kind)
returns bigint
language plpgsql security definer set search_path = public as $$
declare
  -- Subset of [A-Z0-9] without O, 0, I and 1, so codes read clearly on a projector.
  v_alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_host bigint := my_host_id();
  v_code text;
  v_id   bigint;
begin
  if v_host is null or not exists (select 1 from questionnaires
                                    where id = p_questionnaire_id and host_id = v_host) then
    raise exception 'Not allowed';
  end if;
  if p_kind is null then
    raise exception 'Choose a kind';
  end if;
  if not exists (select 1 from questions where questionnaire_id = p_questionnaire_id) then
    raise exception 'Questionnaire has no questions';
  end if;
  if exists (select 1 from questions q
               left join question_keys k on k.question_id = q.id
              where q.questionnaire_id = p_questionnaire_id and k.question_id is null) then
    raise exception 'Every question needs a correct answer';
  end if;

  loop
    select string_agg(substr(v_alphabet, 1 + floor(random() * 32)::int, 1), '')
      into v_code from generate_series(1, 6);
    insert into sessions (host_id, questionnaire_id, join_code, kind)
    values (v_host, p_questionnaire_id, v_code, p_kind)
    on conflict (join_code) do nothing
    returning id into v_id;
    exit when v_id is not null;
  end loop;

  return v_id;
end $$;

-- 4. Functions that read the kind now read it from the session.
create or replace function public.start_question(p_session_id bigint, p_question_id bigint)
returns timestamptz
language plpgsql security definer set search_path = public as $$
declare
  v_session sessions%rowtype;
  v_seconds int;
  v_ends    timestamptz;
begin
  select * into v_session
    from sessions
   where id = p_session_id and host_id = my_host_id()
     for update;
  if not found then raise exception 'Not allowed'; end if;

  if v_session.kind = 'pretest' then
    raise exception 'Pre-tests are self-paced';
  end if;

  if v_session.status = 'finished' then raise exception 'Session is finished'; end if;
  if v_session.status = 'question' and now() <= v_session.question_ends_at then
    raise exception 'A question is already running';
  end if;
  if v_session.current_question_id = p_question_id then
    raise exception 'This question has already been asked';
  end if;

  select coalesce(q.seconds_override, qn.seconds_per_question)
    into v_seconds
    from questions q
    join questionnaires qn on qn.id = q.questionnaire_id
   where q.id = p_question_id and qn.id = v_session.questionnaire_id;
  if not found then raise exception 'Not allowed'; end if;

  if not exists (select 1 from question_keys where question_id = p_question_id) then
    raise exception 'Question has no correct answer';
  end if;

  v_ends := now() + make_interval(secs => v_seconds);

  update sessions
     set status = 'question',
         current_question_id = p_question_id,
         question_started_at = now(),
         question_ends_at = v_ends,
         started_at = coalesce(started_at, now())
   where id = p_session_id;

  return v_ends;
end $$;

create or replace function public.open_pretest(p_session_id bigint) returns void
language plpgsql security definer set search_path = public as $$
begin
  update sessions s
     set status = 'question',
         started_at = coalesce(s.started_at, now())
   where s.id = p_session_id
     and s.host_id = my_host_id()
     and s.status = 'lobby'
     and s.kind = 'pretest';
  if not found then raise exception 'Pre-test cannot be opened'; end if;
end $$;

create or replace function public.next_question(p_session_id bigint) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_participant participants%rowtype;
  v_next        bigint;
  v_seconds     int;
begin
  if not exists (
    select 1 from sessions s
     where s.id = p_session_id and s.status = 'question' and s.kind = 'pretest'
  ) then
    raise exception 'Pre-test is not open';
  end if;

  select * into v_participant
    from participants
   where session_id = p_session_id and quizzer_id = my_quizzer_id() and not is_kicked
     for update;
  if not found then raise exception 'Not a participant'; end if;
  if v_participant.finished_at is not null then
    raise exception 'You have finished this pre-test';
  end if;

  if v_participant.current_question_id is not null
     and now() <= v_participant.question_ends_at
     and not exists (select 1 from answers
                      where participant_id = v_participant.id
                        and question_id = v_participant.current_question_id) then
    raise exception 'Answer or wait for the timer first';
  end if;

  -- shortcut: progress is a count, so reordering or deleting questions mid-session
  -- can skip or repeat one; store served ids if hosts start editing live pre-tests.
  select q.id, coalesce(q.seconds_override, qn.seconds_per_question)
    into v_next, v_seconds
    from sessions s
    join questionnaires qn on qn.id = s.questionnaire_id
    join questions q on q.questionnaire_id = qn.id
   where s.id = p_session_id
     and exists (select 1 from question_keys k where k.question_id = q.id)
   order by q.position, q.id
  offset v_participant.questions_served
   limit 1;

  if v_next is null then
    update participants
       set current_question_id = null,
           question_started_at = null,
           question_ends_at = null,
           finished_at = now()
     where id = v_participant.id;
  else
    update participants
       set current_question_id = v_next,
           question_started_at = now(),
           question_ends_at = now() + make_interval(secs => v_seconds),
           questions_served = questions_served + 1
     where id = v_participant.id;
  end if;
end $$;

create or replace function public.get_my_progress(p_session_id bigint) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
           'kind', s.kind,
           'question_id', p.current_question_id,
           'question_started_at', p.question_started_at,
           'question_ends_at', p.question_ends_at,
           'served', p.questions_served,
           'total', (select count(*) from questions q
                      where q.questionnaire_id = s.questionnaire_id
                        and exists (select 1 from question_keys k where k.question_id = q.id)),
           'finished_at', p.finished_at)
    from participants p
    join sessions s on s.id = p.session_id
   where p.session_id = p_session_id
     and p.quizzer_id = my_quizzer_id()
     and not p.is_kicked;
$$;

create or replace function public.get_reveal(p_session_id bigint, p_question_id bigint)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_kind        session_kind;
  v_participant bigint;
  v_total       bigint;
  v_correct     text;
  v_mine        jsonb;
  v_counts      jsonb;
begin
  select s.kind into v_kind
    from sessions s
   where s.id = p_session_id
     and s.status = 'reveal'
     and s.current_question_id = p_question_id;
  if not found then return null; end if;

  select p.id into v_participant
    from participants p
   where p.session_id = p_session_id
     and p.quizzer_id = my_quizzer_id()
     and not p.is_kicked;
  if not found then return null; end if;

  select coalesce(sum(a.points_awarded), 0) into v_total
    from answers a where a.participant_id = v_participant;

  if v_kind = 'pretest' then
    return jsonb_build_object('kind', v_kind, 'points_so_far', v_total);
  end if;

  select k.correct_choice::text into v_correct
    from question_keys k where k.question_id = p_question_id;

  select jsonb_build_object('selected_choice', a.selected_choice::text,
                            'is_correct', a.is_correct,
                            'points_awarded', a.points_awarded)
    into v_mine
    from answers a
   where a.participant_id = v_participant and a.question_id = p_question_id;

  select coalesce(jsonb_object_agg(c.selected_choice, c.n), '{}'::jsonb) into v_counts
    from (select a.selected_choice::text as selected_choice, count(*) as n
            from answers a
           where a.session_id = p_session_id and a.question_id = p_question_id
           group by 1) c;

  return jsonb_build_object('kind', v_kind,
                            'correct_choice', v_correct,
                            'my_answer', v_mine,
                            'counts', v_counts,
                            'points_so_far', v_total);
end $$;

create or replace function public.submit_answer(p_session_id bigint, p_question_id bigint,
                                                p_choice character)
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_session      sessions%rowtype;
  v_participant  participants%rowtype;
  v_started      timestamptz;
  v_ends         timestamptz;
  v_correct      char(1);
  v_points       int;
  v_choice_text  text;
  v_elapsed_ms   int;
  v_window_ms    numeric;
  v_is_correct   boolean;
  v_awarded      int := 0;
begin
  select * into v_session from sessions where id = p_session_id;
  if not found then raise exception 'Question is not open'; end if;

  select * into v_participant
    from participants p
   where p.session_id = p_session_id
     and p.quizzer_id = my_quizzer_id()
     and not p.is_kicked;
  if not found then raise exception 'Not a participant'; end if;

  if v_session.kind = 'pretest' then
    if v_session.status <> 'question'
       or v_participant.current_question_id is distinct from p_question_id then
      raise exception 'Question is not open';
    end if;
    v_started := v_participant.question_started_at;
    v_ends    := v_participant.question_ends_at;
  else
    if v_session.status <> 'question'
       or v_session.current_question_id is distinct from p_question_id then
      raise exception 'Question is not open';
    end if;
    v_started := v_session.question_started_at;
    v_ends    := v_session.question_ends_at;
  end if;

  if now() > v_ends then
    raise exception 'Time is up';
  end if;

  select k.correct_choice, q.points,
         case upper(p_choice)
           when 'A' then q.choice_a
           when 'B' then q.choice_b
           when 'C' then q.choice_c
           when 'D' then q.choice_d
         end
    into v_correct, v_points, v_choice_text
    from question_keys k join questions q on q.id = k.question_id
   where k.question_id = p_question_id;
  if not found then raise exception 'Question has no correct answer'; end if;

  if nullif(btrim(v_choice_text), '') is null then
    raise exception 'Invalid choice';
  end if;

  v_elapsed_ms := greatest(0, floor(extract(epoch from now() - v_started) * 1000))::int;
  v_window_ms  := extract(epoch from v_ends - v_started) * 1000;
  v_is_correct := upper(p_choice) = v_correct;

  if v_is_correct then
    -- Speed bonus: full points instantly, half points at the buzzer.
    v_awarded := round(v_points * (1 - (v_elapsed_ms / v_window_ms) / 2));
  end if;

  insert into answers (session_id, participant_id, question_id, selected_choice,
                       is_correct, points_awarded, response_ms)
  values (p_session_id, v_participant.id, p_question_id, upper(p_choice),
          v_is_correct, v_awarded, v_elapsed_ms)
  on conflict (participant_id, question_id) do nothing;

  return found;   -- false = already answered
end $$;

-- 5. The two table functions return the new type, so they are recreated.
drop function public.get_history();

create function public.get_history()
returns table (session_id bigint, started_at timestamptz, ended_at timestamptz,
               questionnaire_id bigint, questionnaire_name text, kind session_kind,
               participant_count bigint, average_score numeric, average_accuracy numeric)
language sql stable security definer set search_path = public as $$
  with scores as (
    select p.session_id,
           p.id,
           coalesce(sum(a.points_awarded), 0) as score,
           count(a.id) as answered,
           count(a.id) filter (where a.is_correct) as correct
      from participants p
      left join answers a on a.participant_id = p.id
     where not p.is_kicked
     group by p.session_id, p.id
  )
  select s.id, s.started_at, s.ended_at, qn.id, qn.name, s.kind,
         count(sc.id),
         round(coalesce(avg(sc.score), 0), 1),
         round(coalesce(sum(sc.correct)::numeric / nullif(sum(sc.answered), 0), 0), 4)
    from sessions s
    join questionnaires qn on qn.id = s.questionnaire_id
    left join scores sc on sc.session_id = s.id
   where s.host_id = my_host_id() and s.status = 'finished'
   group by s.id, qn.id
   order by s.ended_at desc;
$$;

drop function public.get_participants_overview();

create function public.get_participants_overview()
returns table (participant_id bigint, display_name text, full_name text, session_id bigint,
               join_code text, questionnaire_name text, kind session_kind, score bigint,
               is_kicked boolean, joined_at timestamptz)
language sql stable security definer set search_path = public as $$
  select p.id, p.display_name, z.full_name, s.id, s.join_code, qn.name, s.kind,
         coalesce(sum(a.points_awarded), 0), p.is_kicked, p.joined_at
    from participants p
    join quizzers z on z.id = p.quizzer_id
    join sessions s on s.id = p.session_id
    join questionnaires qn on qn.id = s.questionnaire_id
    left join answers a on a.participant_id = p.id
   where s.host_id = my_host_id()
   group by p.id, z.id, s.id, qn.id
   order by p.joined_at desc;
$$;

-- 6. Remove the old column and type.
alter table public.questionnaires drop column kind;
drop type questionnaire_kind;

-- 7. Grants. New and recreated functions start with the default public execute.
revoke execute on function public.create_session(bigint, session_kind) from public, anon;
revoke execute on function public.get_history()                        from public, anon;
revoke execute on function public.get_participants_overview()          from public, anon;
revoke execute on function public.block_session_kind_change()          from public, anon, authenticated;

grant execute on function public.create_session(bigint, session_kind) to authenticated;
grant execute on function public.get_history()                        to authenticated;
grant execute on function public.get_participants_overview()          to authenticated;
