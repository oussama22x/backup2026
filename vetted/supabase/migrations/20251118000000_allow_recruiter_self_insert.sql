-- Allow authenticated users to insert their own recruiter profile during signup
create policy "Users can insert own recruiter profile"
on public.recruiters
for insert
to authenticated
with check (user_id = auth.uid());

-- Allow authenticated users to view their own recruiter profile
create policy "Users can view own recruiter profile"
on public.recruiters
for select
to authenticated
using (user_id = auth.uid());

-- Allow authenticated users to update their own recruiter profile
create policy "Users can update own recruiter profile"
on public.recruiters
for update
to authenticated
using (user_id = auth.uid());

-- Allow admins to view all recruiter profiles
create policy "Admins can view all recruiter profiles"
on public.recruiters
for select
to authenticated
using (public.is_admin());

-- Allow admins to update all recruiter profiles
create policy "Admins can update all recruiter profiles"
on public.recruiters
for update
to authenticated
using (public.is_admin());
