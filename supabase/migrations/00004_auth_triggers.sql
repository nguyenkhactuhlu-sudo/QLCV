-- Migration 00004: Auth triggers and profile auto-creation
-- Ngay: 23/08/2026

-- ============================================
-- AUTO-CREATE PROFILE ON USER SIGNUP
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_unit_id UUID;
  v_role user_role;
  v_full_name TEXT;
BEGIN
  -- Extract metadata from raw_user_meta_data
  v_unit_id := (NEW.raw_user_meta_data->>'unit_id')::UUID;
  v_role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::user_role,
    'staff'::user_role
  );
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
  );

  -- Default to first unit if not specified
  IF v_unit_id IS NULL THEN
    SELECT id INTO v_unit_id FROM units ORDER BY created_at LIMIT 1;
  END IF;

  INSERT INTO public.profiles (id, full_name, role, unit_id)
  VALUES (
    NEW.id,
    v_full_name,
    v_role,
    v_unit_id
  );

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- PREVENT ROLE ESCALATION IN TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION check_profile_update()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Only administrators can change role or unit_id
  IF (
    NEW.role IS DISTINCT FROM OLD.role OR
    NEW.unit_id IS DISTINCT FROM OLD.unit_id
  ) AND (
    NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'administrator')
  ) THEN
    RAISE EXCEPTION 'Only administrators can change role or unit';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_check_profile_update
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION check_profile_update();

-- ============================================
-- RATE LIMITING CHECK FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_action VARCHAR(100),
  p_max_count INTEGER,
  p_window_minutes INTEGER DEFAULT 5
)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM audit_logs
  WHERE actor_id = auth.uid()
    AND action = p_action
    AND created_at > now() - (p_window_minutes || ' minutes')::INTERVAL;

  RETURN v_count < p_max_count;
END;
$$;
