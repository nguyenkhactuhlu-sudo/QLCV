-- RLS Test Script - QLCV
-- Run these SQL queries to verify RLS policies work correctly
-- Execute after setting up auth.users and profiles in local Supabase

-- ============================================
-- TEST 1: Anon user cannot read work logs
-- ============================================
-- Expected: Empty set / permission denied
SET LOCAL ROLE anon;
SELECT * FROM work_logs LIMIT 1;

-- ============================================
-- TEST 2: Staff A cannot read Staff B logs
-- ============================================
-- Expected: Only sees own logs
SET LOCAL ROLE authenticated;
SELECT * FROM work_logs WHERE author_id != auth.uid();

-- ============================================
-- TEST 3: Unit head can read their unit logs
-- ============================================
-- Expected: Sees all logs from their unit
SELECT * FROM work_logs WHERE unit_id = (
  SELECT unit_id FROM profiles WHERE id = auth.uid()
);

-- ============================================
-- TEST 4: Cannot insert log as another user
-- ============================================
-- Expected: RLS violation (author_id != auth.uid())
INSERT INTO work_logs (author_id, unit_id, log_date, category_id, title, result, work_role, duration)
VALUES (
  '00000000-0000-0000-0000-000000000099',  -- Different user
  (SELECT unit_id FROM profiles WHERE id = auth.uid()),
  CURRENT_DATE,
  (SELECT id FROM work_categories LIMIT 1),
  'Test', 'Test', 'chu_tri', 'duoi_2_gio'
);

-- ============================================
-- TEST 5: Can update own pending log
-- ============================================
-- Expected: Success
UPDATE work_logs SET result = 'Updated'
WHERE id = (
  SELECT id FROM work_logs
  WHERE author_id = auth.uid() AND status = 'pending'
  LIMIT 1
);

-- ============================================
-- TEST 6: Cannot update approved log
-- ============================================
-- Expected: RLS violation or no rows affected
UPDATE work_logs SET result = 'Hacked'
WHERE id = (
  SELECT id FROM work_logs
  WHERE author_id = auth.uid() AND status = 'approved'
  LIMIT 1
);

-- ============================================
-- TEST 7: Only admin can manage registration codes
-- ============================================
-- Expected: RLS violation for non-admin
INSERT INTO registration_codes (code, unit_id, created_by)
VALUES ('TEST-CODE', (SELECT id FROM units LIMIT 1), auth.uid());

-- ============================================
-- TEST 8: Self-review prevention
-- ============================================
-- Expected: RPC returns error
SELECT approve_work_log(
  (SELECT id FROM work_logs WHERE author_id = auth.uid() LIMIT 1),
  8, 8, 'Self review test'
);

-- ============================================
-- TEST 9: Delegation validity
-- ============================================
-- Expected: Cannot review with expired delegation
SELECT approve_work_log(
  (SELECT id FROM work_logs LIMIT 1),
  7, 7, 'Test with delegation'
);
