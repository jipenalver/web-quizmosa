-- History charts group by questionnaire, and names are not unique, so get_history returns the id.
-- A changed return type needs drop and create; the body is unchanged apart from qn.id.

drop function public.get_history();

create function public.get_history()
returns table (session_id bigint, started_at timestamptz, ended_at timestamptz,
               questionnaire_id bigint, questionnaire_name text, kind questionnaire_kind,
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
  select s.id, s.started_at, s.ended_at, qn.id, qn.name, qn.kind,
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

revoke execute on function public.get_history() from public, anon;
grant execute on function public.get_history() to authenticated;
