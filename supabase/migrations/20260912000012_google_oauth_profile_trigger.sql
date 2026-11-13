-- Google/OAuth-aware profile creation. Extends migration 00000000000002:
-- raw_user_meta_data from providers carries full_name/name (Google) and
-- avatar_url/picture instead of nombre/apellido (email signup only).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb := new.raw_user_meta_data;
  full_name text := coalesce(meta ->> 'full_name', meta ->> 'name');
begin
  insert into public.profiles (id, nombre, apellido, avatar_url)
  values (
    new.id,
    coalesce(
      nullif(meta ->> 'nombre', ''),
      split_part(full_name, ' ', 1),
      ''
    ),
    coalesce(
      nullif(meta ->> 'apellido', ''),
      case
        when full_name is not null and position(' ' in full_name) > 0
          then substr(full_name, position(' ' in full_name) + 1)
        else ''
      end,
      ''
    ),
    coalesce(meta ->> 'avatar_url', meta ->> 'picture')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
