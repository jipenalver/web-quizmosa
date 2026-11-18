-- The participants table sorts by score, then by speed, the same tie-break as get_leaderboard:
-- the total response time of correct answers, lower first. A changed return type needs drop and create.

drop function public.get_participants_overview();

create function public.get_participants_overview()
returns table (participant_id bigint, display_name text, full_name text, session_id bigint,
               join_code text, questionnaire_name text, kind session_kind, score bigint,
               total_correct_ms bigint, is_kicked boolean, joined_at timestamptz)
language sql stable security definer set search_path = public as $$
  select p.id, p.display_name, z.full_name, s.id, s.join_code, qn.name, s.kind,
         coalesce(sum(a.points_awarded), 0),
         coalesce(sum(a.response_ms) filter (where a.is_correct), 0),
         p.is_kicked, p.joined_at
    from participants p
    join quizzers z on z.id = p.quizzer_id
    join sessions s on s.id = p.session_id
    join questionnaires qn on qn.id = s.questionnaire_id
    left join answers a on a.participant_id = p.id
   where s.host_id = my_host_id()
   group by p.id, z.id, s.id, qn.id
   order by p.joined_at desc;
$$;

revoke execute on function public.get_participants_overview() from public, anon;
grant execute on function public.get_participants_overview() to authenticated;
