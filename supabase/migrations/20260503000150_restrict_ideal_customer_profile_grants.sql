revoke all on table public.ideal_customer_profiles from anon;
revoke all on table public.ideal_customer_profiles from authenticated;

grant select, insert, update on table public.ideal_customer_profiles to authenticated;
