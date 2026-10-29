-- =====================================================================
-- הגרלת קבלות טובות — הגדרת מסד הנתונים ב-Supabase
-- להריץ פעם אחת: Supabase → SQL Editor → New query → להדביק → Run
-- =====================================================================

-- ---------- טבלאות ----------

-- פרופיל לכל משתתפת (נוצר אוטומטית בהרשמה)
create table if not exists public.profiles (
  id          uuid primary key references auth.users on delete cascade,
  full_name   text not null default '',
  is_admin    boolean not null default false,
  created_at  timestamptz not null default now()
);

-- הגרלות. תאריך ההגרלה חייב להיות יום שני
create table if not exists public.draws (
  id             bigint generated always as identity primary key,
  draw_date      date not null check (extract(isodow from draw_date) = 1),
  prize          text not null,
  notes          text,
  status         text not null default 'upcoming' check (status in ('upcoming','done')),
  winner_id      uuid references public.profiles(id) on delete set null,
  winner_name    text,
  total_entries  int,
  drawn_at       timestamptz,
  created_at     timestamptz not null default now()
);

-- רק הגרלה קרובה אחת בכל רגע
create unique index if not exists one_upcoming_draw
  on public.draws ((status)) where status = 'upcoming';

-- סימון שבועי: שורה = "השתתפתי בשבוע הזה" = כרטיס אחד בהגרלה
-- week_start = יום ראשון של אותו שבוע
-- draw_id מתמלא כשהכרטיס נוצל בהגרלה
create table if not exists public.participations (
  user_id     uuid not null references public.profiles(id) on delete cascade,
  week_start  date not null check (extract(dow from week_start) = 0),
  draw_id     bigint references public.draws(id) on delete set null,
  created_at  timestamptz not null default now(),
  primary key (user_id, week_start)
);

-- ---------- פונקציות עזר ----------

-- יום ראשון של השבוע הנוכחי לפי שעון ישראל
create or replace function public.current_week_start()
returns date language sql stable as $$
  select (now() at time zone 'Asia/Jerusalem')::date
         - extract(dow from (now() at time zone 'Asia/Jerusalem'))::int
$$;

-- האם המשתמשת המחוברת מנהלת
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false)
$$;

-- יצירת פרופיל אוטומטית בהרשמה
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- עריכת ההגרלה ----------
-- כל שבוע שהסתיים לפני ההגרלה ועוד לא נוצל = כרטיס אחד.
-- נבחר כרטיס אקראי אחד מכל הכרטיסים, כך שמי שצברה יותר שבועות — סיכוייה גבוהים יותר.
-- שבוע "הסתיים" = התחיל לכל המאוחר ביום ראשון שבשבוע שלפני ההגרלה (draw_date - 8).
create or replace function public.run_draw(p_draw_id bigint)
returns json language plpgsql security definer set search_path = public as $$
declare
  d      public.draws;
  total  int;
  pick   int;
  w      uuid;
  wname  text;
begin
  if not public.is_admin() then
    raise exception 'רק מנהלת יכולה לערוך הגרלה';
  end if;

  select * into d from public.draws where id = p_draw_id for update;
  if not found then raise exception 'ההגרלה לא נמצאה'; end if;
  if d.status <> 'upcoming' then raise exception 'ההגרלה הזאת כבר נערכה'; end if;

  select count(*) into total
  from public.participations
  where draw_id is null and week_start <= d.draw_date - 8;

  if total = 0 then raise exception 'אין עדיין כרטיסים בהגרלה'; end if;

  pick := floor(random() * total)::int;

  select user_id into w
  from public.participations
  where draw_id is null and week_start <= d.draw_date - 8
  order by user_id, week_start
  offset pick limit 1;

  select full_name into wname from public.profiles where id = w;

  update public.participations
     set draw_id = d.id
   where draw_id is null and week_start <= d.draw_date - 8;

  update public.draws
     set status = 'done', winner_id = w, winner_name = wname,
         total_entries = total, drawn_at = now()
   where id = d.id;

  return json_build_object('winner_name', wname, 'total_entries', total);
end $$;

revoke execute on function public.run_draw(bigint) from public, anon;
grant  execute on function public.run_draw(bigint) to authenticated;

-- ---------- הרשאות (RLS) ----------

alter table public.profiles       enable row level security;
alter table public.draws          enable row level security;
alter table public.participations enable row level security;

-- profiles: כל מחוברת רואה שמות; כל אחת מעדכנת רק את השם שלה
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated using (true);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- אסור למשתמשת להפוך את עצמה למנהלת: מותר לעדכן רק את השם
revoke update on public.profiles from anon, authenticated;
grant  update (full_name) on public.profiles to authenticated;
revoke insert, delete on public.profiles from anon, authenticated;

-- draws: כולן (גם לפני התחברות) רואות את ההגרלות; רק מנהלת יוצרת ועורכת
drop policy if exists draws_select on public.draws;
create policy draws_select on public.draws
  for select to anon, authenticated using (true);

drop policy if exists draws_admin_insert on public.draws;
create policy draws_admin_insert on public.draws
  for insert to authenticated with check (public.is_admin() and status = 'upcoming');

drop policy if exists draws_admin_update on public.draws;
create policy draws_admin_update on public.draws
  for update to authenticated
  using (public.is_admin() and status = 'upcoming')
  with check (public.is_admin() and status = 'upcoming');

drop policy if exists draws_admin_delete on public.draws;
create policy draws_admin_delete on public.draws
  for delete to authenticated using (public.is_admin() and status = 'upcoming');

-- participations: כל אחת רואה את שלה, מנהלת רואה הכול.
-- מסמנים רק את השבוע הנוכחי; ביום ראשון אפשר גם לסמן את השבוע שעבר (למי ששכחה במוצאי שבת).
drop policy if exists part_select on public.participations;
create policy part_select on public.participations
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

drop policy if exists part_insert_own on public.participations;
create policy part_insert_own on public.participations
  for insert to authenticated with check (
    user_id = auth.uid()
    and draw_id is null
    and (
      week_start = public.current_week_start()
      or (week_start = public.current_week_start() - 7
          and extract(dow from (now() at time zone 'Asia/Jerusalem')) = 0)
    )
  );

drop policy if exists part_delete_own on public.participations;
create policy part_delete_own on public.participations
  for delete to authenticated using (
    user_id = auth.uid()
    and draw_id is null
    and (
      week_start = public.current_week_start()
      or (week_start = public.current_week_start() - 7
          and extract(dow from (now() at time zone 'Asia/Jerusalem')) = 0)
    )
  );

revoke update on public.participations from anon, authenticated;

-- =====================================================================
-- אחרי שנרשמת לאתר בפעם הראשונה, להריץ את השורה הבאה עם המייל שלך
-- כדי להפוך את עצמך למנהלת:
--
-- update public.profiles set is_admin = true
--  where id = (select id from auth.users where email = 'your@email.com');
-- =====================================================================

-- =====================================================================
-- מנהלות לפי מייל (נוסף אחרי ההקמה הראשונה)
-- מי שנרשמת עם אחד המיילים ברשימה רואה את אזור הניהול. להוספת מנהלת:
--   insert into public.admin_emails (email) values ('name@gmail.com');
-- =====================================================================
create table if not exists public.admin_emails (email text primary key);
alter table public.admin_emails enable row level security;
revoke all on public.admin_emails from anon, authenticated;

insert into public.admin_emails (email) values
  ('chaya7908@gmail.com'), ('zipi3637@gmail.com')
on conflict do nothing;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, is_admin)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    exists (select 1 from public.admin_emails a where a.email = lower(new.email))
  );
  return new;
end $$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from auth.users u
    join public.admin_emails a on a.email = lower(u.email)
    where u.id = auth.uid()
  )
$$;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- =====================================================================
-- הקבלה היא לשבת: מסמנים את השבת שעברה, ממוצאי שבת ועד יום שישי
-- (נוסף אחרי ההקמה הראשונה; מחליף את כללי הסימון שלמעלה)
-- =====================================================================
create or replace function public.markable_week()
returns date language sql stable set search_path = public as $$
  select case
           when extract(dow from n) = 6 and extract(hour from n) >= 17 then n::date - 6
           else n::date - extract(dow from n)::int - 7
         end
  from (select now() at time zone 'Asia/Jerusalem' as n) t
$$;

drop policy if exists part_insert_own on public.participations;
create policy part_insert_own on public.participations
  for insert to authenticated with check (
    user_id = (select auth.uid()) and draw_id is null and week_start = public.markable_week());

drop policy if exists part_delete_own on public.participations;
create policy part_delete_own on public.participations
  for delete to authenticated using (
    user_id = (select auth.uid()) and draw_id is null and week_start = public.markable_week());

-- =====================================================================
-- מונים לכרטיס ההגרלה (מספרים בלבד, בלי שמות) — גלויים לכולן
-- =====================================================================
create or replace function public.draw_ticket_count()
returns int language sql stable security definer set search_path = public as $$
  select count(*)::int
  from public.participations p
  join public.draws d on d.status = 'upcoming'
  where p.draw_id is null and p.week_start <= d.draw_date - 8;
$$;
revoke execute on function public.draw_ticket_count() from public;
grant  execute on function public.draw_ticket_count() to anon, authenticated;

-- כמה כבר השתתפו בקבלה של השבת שאפשר לסמן עכשיו
create or replace function public.week_participant_count()
returns int language sql stable security definer set search_path = public as $$
  select count(*)::int from public.participations where week_start = public.markable_week();
$$;
revoke execute on function public.week_participant_count() from public;
grant  execute on function public.week_participant_count() to anon, authenticated;

-- =====================================================================
-- מחיקת משתמשת על ידי מנהלת (נוסף אחרי ההקמה הראשונה)
-- מוחק את החשבון; הפרופיל והסימונים נמחקים איתו. שם הזוכה בהגרלות שנערכו נשמר.
-- אי אפשר למחוק את עצמך או מנהלת אחרת.
-- =====================================================================
create or replace function public.admin_delete_user(p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'רק מנהלת יכולה למחוק משתמשות';
  end if;
  if p_user = auth.uid() then
    raise exception 'אי אפשר למחוק את החשבון שלך';
  end if;
  if exists (select 1 from auth.users u join public.admin_emails a on a.email = lower(u.email) where u.id = p_user) then
    raise exception 'אי אפשר למחוק מנהלת';
  end if;
  delete from auth.users where id = p_user;
  if not found then raise exception 'המשתמשת לא נמצאה'; end if;
end $$;
revoke execute on function public.admin_delete_user(uuid) from public, anon;
grant  execute on function public.admin_delete_user(uuid) to authenticated;
