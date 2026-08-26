-- Initial Zimbabwe branch directory for the iProperties demo.
-- This migration creates location records only; it does not transfer website
-- content, property records, media, or storage objects.

insert into public.branches (name, address, contact_number)
values
  ('Harare', 'Borrowdale, Harare, Zimbabwe', '+263 77 100 0001'),
  ('Bulawayo', 'Hillside, Bulawayo, Zimbabwe', '+263 77 100 0002')
on conflict (name) do update
set
  address = excluded.address,
  contact_number = excluded.contact_number;
