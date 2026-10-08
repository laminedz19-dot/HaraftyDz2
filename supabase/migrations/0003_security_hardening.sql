create policy "service areas public read" on public.service_areas for select using (true);
create policy "service areas artisan write" on public.service_areas for all using (artisan_id = auth.uid()) with check (artisan_id = auth.uid());

create policy "user roles own read" on public.user_roles for select using (user_id = auth.uid());
create policy "user roles admin read" on public.user_roles for select using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'moderator'));

revoke execute on function public.has_role(uuid, public.app_role) from anon, authenticated;
