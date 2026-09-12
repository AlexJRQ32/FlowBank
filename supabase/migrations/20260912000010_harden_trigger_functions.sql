-- Harden trigger functions (security advisor fix), mirrors what was applied to the cloud project.

-- Pin search_path unqualified so the function cannot be hijacked by a malicious schema.
alter function public.handle_new_user() set search_path = public;

-- EXECUTE on the trigger function is unnecessary for direct callers;
-- revoke from everybody except the owning role that the trigger runs as.
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.handle_new_user() from authenticated;
revoke execute on function public.handle_new_user() from postgres;
