-- Sua loi kieu du lieu trong list_trash_work_logs (migration 00082): profiles.full_name
-- la VARCHAR(255) nhung ham khai bao cot tra ve la TEXT -> Postgres bao loi 42804
-- "structure of query does not match function result type". Ep kieu ::TEXT cho ca
-- 2 cot lay tu full_name (author_name, deleted_by_name).
CREATE OR REPLACE FUNCTION list_trash_work_logs()
RETURNS TABLE(
  id UUID,
  author_id UUID,
  author_name TEXT,
  unit_id UUID,
  title TEXT,
  result TEXT,
  category_id UUID,
  log_date DATE,
  status TEXT,
  complexity_score TEXT,
  quality_score TEXT,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID,
  deleted_by_name TEXT,
  delete_reason TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT wl.id, wl.author_id, p1.full_name::TEXT, wl.unit_id, wl.title, wl.result,
         wl.category_id, wl.log_date, wl.status::TEXT, wl.complexity_score::TEXT, wl.quality_score::TEXT,
         wl.deleted_at, wl.deleted_by, p2.full_name::TEXT, wl.delete_reason
  FROM work_logs wl
  LEFT JOIN profiles p1 ON p1.id = wl.author_id
  LEFT JOIN profiles p2 ON p2.id = wl.deleted_by
  WHERE wl.deleted_at IS NOT NULL
    AND (wl.author_id = auth.uid() OR public.can_manage_person(wl.author_id))
  ORDER BY wl.deleted_at DESC;
END;
$$;
