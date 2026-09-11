-- ═══════════════════════════════════════════════════════════════
--  0015 — A CLEAR HAS TO REACH THE DEVICES
--
--  Clearing data in Postgres did not clear it on the floor. Every device
--  mirrors the whole app state in localStorage, and pull() deliberately keeps
--  its local rows whenever the server looks empty — the guard at
--  supabase-db.js that stops a half-loaded phone from wiping the factory:
--
--      if (!remote.length && local.length) return local;
--
--  Good guard, real cost. After the operational data was cleared on
--  2026-09-11 every device carried on showing the deleted attendance,
--  sessions and stock, and an owner device would have pushed all of it back
--  on its next edit. The only way out was opening a browser console on every
--  phone and laptop in the factory, which is not a thing anyone will do.
--
--  Nothing can reach into another browser's storage, so the device has to be
--  told to let go. One timestamp does it: the owner bumps `epoch`, every
--  device notices its own copy is older, drops its cache and reloads onto
--  whatever Postgres actually holds.
--
--  To force every device to reset after clearing data:
--
--      update data_epoch set epoch = now(), note = 'why' where id = 1;
--
--  Readable by everyone signed in, because the check runs on their device and
--  cannot run on a row it cannot see. Writable only by the owner — this makes
--  every phone in the building throw away unsynced work.
-- ═══════════════════════════════════════════════════════════════

create table if not exists data_epoch (
  id      smallint primary key default 1 check (id = 1),
  epoch   timestamptz not null default now(),
  note    text
);

comment on table data_epoch is
  'One row. Bump epoch to make every device drop its local cache and reload '
  'from Postgres - the way a server-side data clear reaches the floor.';

insert into data_epoch (id, epoch, note)
values (1, now(), 'operational data cleared; workers restored')
on conflict (id) do nothing;

alter table data_epoch enable row level security;

drop policy if exists data_epoch_read on data_epoch;
create policy data_epoch_read on data_epoch
  for select to authenticated using (true);

drop policy if exists data_epoch_owner_write on data_epoch;
create policy data_epoch_owner_write on data_epoch
  for all using (is_owner()) with check (is_owner());
