create policy "admin services read" on public.artisan_services
for select using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'moderator'));

create policy "admin services update" on public.artisan_services
for update using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'moderator'))
with check (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'moderator'));

create policy "admin requests read" on public.service_requests
for select using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'moderator'));

create policy "admin requests update" on public.service_requests
for update using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'moderator'))
with check (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'moderator'));

create policy "admin profiles read" on public.profiles
for select using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'moderator'));
