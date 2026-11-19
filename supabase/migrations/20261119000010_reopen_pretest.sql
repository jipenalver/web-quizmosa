-- Reopen a finished pre-test so people who missed it can still join with the same code.
-- Nothing already recorded changes: a participant who finished is refused by next_question(),
-- and rejoining from the same browser returns their existing row. finish_session() closes it
-- again and sets a new ended_at. Pre-tests only, and only the owning host.

create function public.reopen_pretest(p_session_id bigint) returns void
language plpgsql security definer set search_path = public as $$
begin
  update sessions
     set status = 'question',
         ended_at = null
   where id = p_session_id
     and host_id = my_host_id()
     and status = 'finished'
     and kind = 'pretest';
  if not found then raise exception 'Only a finished pre-test can be reopened'; end if;
end $$;

revoke execute on function public.reopen_pretest(bigint) from public, anon;
grant execute on function public.reopen_pretest(bigint) to authenticated;
