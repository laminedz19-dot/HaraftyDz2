create policy "own profile insert" on public.profiles
for insert
with check (id = auth.uid());
