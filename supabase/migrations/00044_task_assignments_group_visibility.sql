-- Migration 00044: Cho phep xem TEN cac dong CUNG NHOM (task_group_id) khi
-- 1 viec duoc giao cho nhieu nguoi cung luc (1 chu tri + N phoi hop).
-- Ngay: 29/08/2026
--
-- Ly do: RLS goc (migration 00031) chi cho xem dong ma minh la assigner
-- HOAC assignee - dung cho mo hinh cu "1 dong = 1 lan giao". Voi mo hinh
-- moi (nhieu dong cung 1 task_group_id, xem migration 00039/00042), phia
-- "Viec duoc giao cho toi" can hien "Cung thuc hien: ..." (ten nhung nguoi
-- khac trong CUNG 1 lan giao), nhung RLS cu se an het cac dong do vi
-- assignee_id cua ho khac voi minh. Mo rong policy: cho xem them cac dong
-- co task_group_id trung voi 1 dong ma minh da co quyen xem san (dung
-- EXISTS tu tham chieu, la mau RLS chuan cua Postgres/Supabase, khong gay
-- de quy vo han vi dieu kien goc (assigner_id/assignee_id = auth.uid())
-- luon tu dat duoc doc lap, khong phu thuoc nhanh EXISTS).
DROP POLICY IF EXISTS "task_assignments_select" ON task_assignments;
CREATE POLICY "task_assignments_select" ON task_assignments
  FOR SELECT USING (
    assigner_id = auth.uid() OR assignee_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM task_assignments t2
      WHERE t2.task_group_id = task_assignments.task_group_id
        AND (t2.assigner_id = auth.uid() OR t2.assignee_id = auth.uid())
    )
  );
