-- Migration 00002: RLS policies cho QLCV
-- Ngay: 23/08/2026

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE unit_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE delegations ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_log_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_log_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE registration_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION auth.user_role() RETURNS user_role
  LANGUAGE sql STABLE SECURITY DEFINER AS 
  SELECT role FROM profiles WHERE id = auth.uid();
;

-- ============================================
-- UNITS - ai cung doc duoc unit
-- ============================================
CREATE POLICY "units_select_authenticated" ON units
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "units_admin_all" ON units
  FOR ALL USING (
    auth.user_role() = 'administrator'::user_role
  );

-- ============================================
-- PROFILES - doc co ban, gioi han ghi
-- ============================================
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "profiles_select_unit_leaders" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('province_head', 'province_deputy', 'unit_head', 'administrator')
    )
  );

CREATE POLICY "profiles_select_unit" ON profiles
  FOR SELECT USING (
    unit_id IN (
      SELECT p2.unit_id FROM profiles p2 WHERE p2.id = auth.uid()
    )
  );

CREATE POLICY "profiles_admin_all" ON profiles
  FOR ALL USING (
    auth.user_role() = 'administrator'::user_role
  );

-- ============================================
-- WORK LOGS - quyen phuc tap
-- ============================================
-- Staff doc nhat ky cua ban than
CREATE POLICY "work_logs_select_own" ON work_logs
  FOR SELECT USING (author_id = auth.uid());

-- Lanh dao doc nhat ky don vi minh
CREATE POLICY "work_logs_select_unit" ON work_logs
  FOR SELECT USING (
    unit_id IN (
      SELECT p.unit_id FROM profiles p WHERE p.id = auth.uid()
    )
  );

-- Lanh dao tinh doc toan bo
CREATE POLICY "work_logs_select_province" ON work_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('province_head', 'administrator')
    )
  );

-- Pho vien truong xem don vi duoc phan cong
CREATE POLICY "work_logs_select_assigned" ON work_logs
  FOR SELECT USING (
    unit_id IN (
      SELECT ua.unit_id FROM unit_assignments ua WHERE ua.user_id = auth.uid()
    )
  );

-- Staff tao nhat ky
CREATE POLICY "work_logs_insert_staff" ON work_logs
  FOR INSERT WITH CHECK (
    author_id = auth.uid()
  );

-- Staff sua nhat ky cua minh (chi khi pending hoac revision)
CREATE POLICY "work_logs_update_own" ON work_logs
  FOR UPDATE USING (
    author_id = auth.uid()
    AND status IN ('pending', 'revision')
    AND is_locked = false
  );

-- ============================================
-- WORK LOG REVISIONS
-- ============================================
CREATE POLICY "revisions_select_own" ON work_log_revisions
  FOR SELECT USING (
    log_id IN (SELECT id FROM work_logs WHERE author_id = auth.uid())
  );

CREATE POLICY "revisions_select_reviewer" ON work_log_revisions
  FOR SELECT USING (
    log_id IN (
      SELECT id FROM work_logs
      WHERE reviewer_id = auth.uid()
    )
  );

-- ============================================
-- NOTIFICATIONS - chi user do duoc xem
-- ============================================
CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- ============================================
-- AUDIT LOGS - chi admin xem
-- ============================================
CREATE POLICY "audit_logs_select_admin" ON audit_logs
  FOR SELECT USING (
    auth.user_role() = 'administrator'::user_role
  );

-- ============================================
-- DELEGATIONS - xem theo pham vi
-- ============================================
CREATE POLICY "delegations_select_own" ON delegations
  FOR SELECT USING (
    delegator_id = auth.uid() OR delegate_id = auth.uid()
  );

CREATE POLICY "delegations_admin_all" ON delegations
  FOR ALL USING (
    auth.user_role() = 'administrator'::user_role
  );

-- ============================================
-- REGISTRATION CODES - admin only
-- ============================================
CREATE POLICY "registration_codes_admin_all" ON registration_codes
  FOR ALL USING (
    auth.user_role() = 'administrator'::user_role
  );

-- ============================================
-- PENDING ACCOUNTS - admin only
-- ============================================
CREATE POLICY "pending_accounts_admin_all" ON pending_accounts
  FOR ALL USING (
    auth.user_role() = 'administrator'::user_role
  );

-- ============================================
-- ATTACHMENTS - theo quyen work_log
-- ============================================
CREATE POLICY "attachments_select_own" ON attachments
  FOR SELECT USING (
    log_id IN (SELECT id FROM work_logs WHERE author_id = auth.uid())
  );

-- ============================================
-- WORK CATEGORIES - ai cung doc duoc
-- ============================================
CREATE POLICY "work_categories_select_all" ON work_categories
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "work_categories_admin_all" ON work_categories
  FOR ALL USING (
    auth.user_role() = 'administrator'::user_role
  );
