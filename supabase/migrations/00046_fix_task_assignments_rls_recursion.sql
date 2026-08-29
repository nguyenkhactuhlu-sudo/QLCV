-- Migration 00046: KHAN CAP - fix "infinite recursion detected in policy
-- for relation task_assignments" (loi 42P17) do migration 00044 gay ra.
-- Ngay: 29/08/2026
--
-- Su co: migration 00044 mo rong RLS SELECT cua task_assignments bang 1
-- EXISTS subquery THAM CHIEU LAI CHINH BANG task_assignments. Khac voi gia
-- dinh ban dau, Postgres KHONG tu quy ve 1 diem co dinh trong truong hop
-- nay - no phat hien de quy vo han va tu choi truy van hoan toan (loi
-- 42P17). Hau qua: MOI truy van SELECT vao task_assignments (ca "Viec toi
-- da giao" lan "Viec duoc giao cho toi") deu loi tu luc migration 00044
-- duoc chay - phat hien qua kiem thu curl truc tiep tren du lieu that.
--
-- Cach sua dung: chuyen dieu kien EXISTS sang 1 ham SECURITY DEFINER rieng
-- - ham nay chay voi quyen CHU BANG (postgres), CHU BANG mac dinh BO QUA
-- RLS cua chinh no (tru khi bat FORCE ROW LEVEL SECURITY, khong dung o
-- day) - dung y het nguyen tac da dung cho can_manage_person/can_review_log
-- (truy van truc tiep ben trong khong bi RLS chan). Nho vay khong con tham
-- chieu de quy toi policy dang duoc kiem tra.
CREATE OR REPLACE FUNCTION public.can_see_task_group(p_task_group_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM task_assignments
    WHERE task_group_id = p_task_group_id
      AND (assigner_id = auth.uid() OR assignee_id = auth.uid())
  );
$$;

DROP POLICY IF EXISTS "task_assignments_select" ON task_assignments;
CREATE POLICY "task_assignments_select" ON task_assignments
  FOR SELECT USING (
    assigner_id = auth.uid() OR assignee_id = auth.uid()
    OR public.can_see_task_group(task_group_id)
  );
