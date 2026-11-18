-- Pre-test vs post-test per person for one questionnaire, for the comparison page and its awards.
-- Only finished hosts of the caller, without kicked participants. Each person's latest attempt per kind.
-- A person is one quizzer (same browser). Fallback: a quizzer with only a pre-test and one with only
-- a post-test are the same person when full name and alias match (case-insensitive, spaces collapsed)
-- and that name is unique on both sides; a repeated name stays unmatched rather than guessed.

create function public.get_questionnaire_comparison(p_questionnaire_id bigint)
returns table (pre_quizzer_id bigint, post_quizzer_id bigint, full_name text, alias text,
               pre_score bigint, pre_correct_ms bigint, post_score bigint, post_correct_ms bigint,
               matched_by_name boolean)
language sql stable security definer set search_path = public as $$
  with attempts as (
    select p.id as participant_id, p.quizzer_id, s.kind, s.ended_at,
           coalesce(sum(a.points_awarded), 0) as score,
           coalesce(sum(a.response_ms) filter (where a.is_correct), 0) as correct_ms
      from sessions s
      join participants p on p.session_id = s.id and not p.is_kicked
      left join answers a on a.participant_id = p.id
     where s.questionnaire_id = p_questionnaire_id
       and s.host_id = my_host_id()
       and s.status = 'finished'
     group by p.id, s.id
  ),
  latest as (
    select distinct on (quizzer_id, kind) *
      from attempts
     order by quizzer_id, kind, ended_at desc, participant_id desc
  ),
  per_quizzer as (
    select z.id as quizzer_id, z.full_name, z.alias,
           lower(regexp_replace(btrim(z.full_name), '\s+', ' ', 'g')) || '|' ||
           lower(regexp_replace(btrim(coalesce(z.alias, '')), '\s+', ' ', 'g')) as name_key,
           pre.score as pre_score, pre.correct_ms as pre_ms,
           post.score as post_score, post.correct_ms as post_ms
      from quizzers z
      left join latest pre on pre.quizzer_id = z.id and pre.kind = 'pretest'
      left join latest post on post.quizzer_id = z.id and post.kind = 'posttest'
     where pre.quizzer_id is not null or post.quizzer_id is not null
  ),
  pre_only as (select * from per_quizzer where post_score is null),
  post_only as (select * from per_quizzer where pre_score is null),
  name_pairs as (
    select a.quizzer_id as pre_q, b.quizzer_id as post_q
      from pre_only a
      join post_only b on b.name_key = a.name_key
     where (select count(*) from pre_only x where x.name_key = a.name_key) = 1
       and (select count(*) from post_only y where y.name_key = b.name_key) = 1
  )
  select case when q.pre_score is not null then q.quizzer_id end,
         case when q.post_score is not null then q.quizzer_id end,
         q.full_name, q.alias, q.pre_score, q.pre_ms, q.post_score, q.post_ms, false
    from per_quizzer q
   where q.quizzer_id not in (select pre_q from name_pairs union all select post_q from name_pairs)
  union all
  select a.quizzer_id, b.quizzer_id, a.full_name, a.alias,
         a.pre_score, a.pre_ms, b.post_score, b.post_ms, true
    from name_pairs n
    join pre_only a on a.quizzer_id = n.pre_q
    join post_only b on b.quizzer_id = n.post_q
   order by 3;
$$;

revoke execute on function public.get_questionnaire_comparison(bigint) from public, anon;
grant execute on function public.get_questionnaire_comparison(bigint) to authenticated;
