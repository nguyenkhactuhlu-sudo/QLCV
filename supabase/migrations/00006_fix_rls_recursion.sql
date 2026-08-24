-- Migration 00006: Fix RLS recursion issues - moved to public schema
-- Ngay: 23/08/2026

DROP POLICY IF EXISTS "profiles_select_unit_leaders" ON profiles;
DROP POLICY IF EXISTS "profiles_select_unit" ON profiles;
DROP POLICY IF EXISTS "profiles_admin_all" ON profiles;
DROP POLICY IF EXISTS "units_admin_all" ON units;
DROP POLICY IF EXISTS "delegations_admin_all" ON delegations;
DROP POLICY IF EXISTS "registration_codes_admin_all" ON registration_codes;
DROP POLICY IF EXISTS "pending_accounts_admin_all" ON pending_accounts;
DROP POLICY IF EXISTS "audit_logs_select_admin" ON audit_logs;
DROP POLICY IF EXISTS "work_categories_admin_all" ON work_categories;
DROP POLICY IF EXISTS "work_logs_select_province" ON work_logs;
DROP POLICY IF EXISTS "work_logs_insert_staff" ON work_logs;

CREATE OR REPLACE FUNCTION public.user_role() RETURNS user_role
  LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

CREATE POLICY "profiles_select_unit_leaders" ON profiles
  FOR SELECT USING (
    public.user_role() IN ('province_head'::user_role, 'province_deputy'::user_role, 'unit_head'::user_role, 'administrator'::user_role)
  );

CREATE POLICY "profiles_select_unit" ON profiles
  FOR SELECT USING (
    unit_id IN (SELECT p.unit_id FROM profiles p WHERE p.id = auth.uid())
  );

CREATE POLICY "profiles_admin_all" ON profiles
  FOR ALL USING (public.user_role() = 'administrator'::user_role);

CREATE POLICY "units_admin_all" ON units
  FOR ALL USING (public.user_role() = 'administrator'::user_role);

CREATE POLICY "delegations_admin_all" ON delegations
  FOR ALL USING (public.user_role() = 'administrator'::user_role);

CREATE POLICY "registration_codes_admin_all" ON registration_codes
  FOR ALL USING (public.user_role() = 'administrator'::user_role);

CREATE POLICY "pending_accounts_admin_all" ON pending_accounts
  FOR ALL USING (public.user_role() = 'administrator'::user_role);

CREATE POLICY "audit_logs_select_admin" ON audit_logs
  FOR SELECT USING (public.user_role() = 'administrator'::user_role);

CREATE POLICY "work_categories_admin_all" ON work_categories
  FOR ALL USING (public.user_role() = 'administrator'::user_role);

CREATE POLICY "work_logs_select_province" ON work_logs
  FOR SELECT USING (
    public.user_role() IN ('province_head'::user_role, 'administrator'::user_role)
  );

CREATE POLICY "work_logs_insert_staff" ON work_logs
  FOR INSERT WITH CHECK (author_id = auth.uid());