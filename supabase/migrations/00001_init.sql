-- Migration 00001: Khoi tao schema co ban cho QLCV
-- Ngay: 23/08/2026

-- ============================================
-- ENUMS
-- ============================================
CREATE TYPE user_role AS ENUM (
  'province_head',
  'province_deputy',
  'unit_head',
  'unit_deputy',
  'staff',
  'administrator'
);

CREATE TYPE journal_status AS ENUM (
  'pending',
  'approved',
  'revision'
);

CREATE TYPE unit_type AS ENUM (
  'province',
  'department',
  'regional'
);

CREATE TYPE delegation_status AS ENUM (
  'active',
  'expired',
  'revoked'
);

CREATE TYPE notification_type AS ENUM (
  'pending_review',
  'approved',
  'revision_requested',
  'account_pending',
  'delegation_expiring',
  'monthly_done'
);

-- ============================================
-- TABLES
-- ============================================

-- Units (don vi)
CREATE TABLE units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  short_name VARCHAR(100),
  type unit_type NOT NULL DEFAULT 'department',
  parent_id UUID REFERENCES units(id) ON DELETE RESTRICT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Profiles (ho so nguoi dung, 1-1 voi auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  title VARCHAR(255),
  professional_title VARCHAR(255),
  role user_role NOT NULL DEFAULT 'staff',
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
  initials VARCHAR(10),
  phone VARCHAR(20),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unit assignments (don vi duoc phan cong cho lanh dao tinh)
CREATE TABLE unit_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, unit_id)
);

-- Delegations (uy quyen)
CREATE TABLE delegations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delegator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  delegate_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  status delegation_status NOT NULL DEFAULT 'active',
  granted_by UUID REFERENCES profiles(id),
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_dates CHECK (ends_at > starts_at)
);

-- Work categories (danh muc cong viec)
CREATE TABLE work_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Work logs (nhat ky cong viec)
CREATE TABLE work_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
  log_date DATE NOT NULL,
  category_id UUID NOT NULL REFERENCES work_categories(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  result TEXT NOT NULL,
  work_role VARCHAR(50) NOT NULL CHECK (work_role IN ('chu_tri', 'phoi_hop')),
  duration VARCHAR(50) NOT NULL CHECK (duration IN ('duoi_2_gio', '2_4_gio', 'tren_4_gio', 'nhieu_ngay')),
  evidence VARCHAR(500),
  status journal_status NOT NULL DEFAULT 'pending',
  complexity_score INTEGER CHECK (complexity_score >= 1 AND complexity_score <= 10),
  quality_score INTEGER CHECK (quality_score >= 1 AND quality_score <= 10),
  reviewer_id UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  review_comment TEXT,
  revision_count INTEGER NOT NULL DEFAULT 0,
  version INTEGER NOT NULL DEFAULT 1,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Work log revisions (lich su phien ban nhat ky)
CREATE TABLE work_log_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_id UUID NOT NULL REFERENCES work_logs(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  snapshot JSONB NOT NULL,
  complexity_score INTEGER CHECK (complexity_score >= 1 AND complexity_score <= 10),
  quality_score INTEGER CHECK (quality_score >= 1 AND quality_score <= 10),
  review_comment TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Work log reviews (luot cham diem)
CREATE TABLE work_log_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_id UUID NOT NULL REFERENCES work_logs(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  complexity_score INTEGER NOT NULL CHECK (complexity_score >= 1 AND complexity_score <= 10),
  quality_score INTEGER NOT NULL CHECK (quality_score >= 1 AND quality_score <= 10),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Monthly reviews (danh gia thang)
CREATE TABLE monthly_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  period VARCHAR(7) NOT NULL,
  self_complexity_score INTEGER CHECK (self_complexity_score >= 1 AND self_complexity_score <= 10),
  self_quality_score INTEGER CHECK (self_quality_score >= 1 AND self_quality_score <= 10),
  official_complexity_score INTEGER CHECK (official_complexity_score >= 1 AND official_complexity_score <= 10),
  official_quality_score INTEGER CHECK (official_quality_score >= 1 AND official_quality_score <= 10),
  classification VARCHAR(20) CHECK (classification IN ('dat_cao', 'dat', 'can_cai_thien')),
  reviewer_id UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, period)
);

-- Attachments (tep dinh kem)
CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_id UUID NOT NULL REFERENCES work_logs(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  storage_provider VARCHAR(50) NOT NULL DEFAULT 'supabase',
  storage_path TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Notifications (thong bao)
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT,
  reference_id UUID,
  reference_type VARCHAR(50),
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Registration codes (ma dang ky)
CREATE TABLE registration_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  is_used BOOLEAN NOT NULL DEFAULT false,
  used_by UUID REFERENCES profiles(id),
  used_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES profiles(id),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Pending accounts (tai khoan cho duyet)
CREATE TABLE pending_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  unit_id UUID REFERENCES units(id),
  role user_role NOT NULL DEFAULT 'staff',
  registration_code_id UUID REFERENCES registration_codes(id),
  is_approved BOOLEAN NOT NULL DEFAULT false,
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Audit logs (nhat ky kiem toan)
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES profiles(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_work_logs_author_id ON work_logs(author_id);
CREATE INDEX idx_work_logs_unit_id ON work_logs(unit_id);
CREATE INDEX idx_work_logs_status ON work_logs(status);
CREATE INDEX idx_work_logs_log_date ON work_logs(log_date);
CREATE INDEX idx_work_logs_reviewer_id ON work_logs(reviewer_id);
CREATE INDEX idx_work_logs_created_at ON work_logs(created_at);

CREATE INDEX idx_monthly_reviews_user_id ON monthly_reviews(user_id);
CREATE INDEX idx_monthly_reviews_period ON monthly_reviews(period);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

CREATE INDEX idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

CREATE INDEX idx_delegations_delegate_id ON delegations(delegate_id);
CREATE INDEX idx_delegations_status ON delegations(status);

CREATE INDEX idx_work_log_revisions_log_id ON work_log_revisions(log_id);

-- ============================================
-- TRIGGER: auto-update updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_units_updated_at BEFORE UPDATE ON units
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_work_logs_updated_at BEFORE UPDATE ON work_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_monthly_reviews_updated_at BEFORE UPDATE ON monthly_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- TRIGGER: audit log for sensitive changes
-- ============================================
CREATE OR REPLACE FUNCTION log_audit()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, old_values, new_values)
  VALUES (
    COALESCE(auth.uid(), NULL),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD)::jsonb ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW)::jsonb ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit trigger to critical tables
CREATE TRIGGER trg_audit_work_logs AFTER INSERT OR UPDATE OR DELETE ON work_logs
  FOR EACH ROW EXECUTE FUNCTION log_audit();
CREATE TRIGGER trg_audit_profiles AFTER INSERT OR UPDATE OR DELETE ON profiles
  FOR EACH ROW EXECUTE FUNCTION log_audit();
CREATE TRIGGER trg_audit_delegations AFTER INSERT OR UPDATE OR DELETE ON delegations
  FOR EACH ROW EXECUTE FUNCTION log_audit();
CREATE TRIGGER trg_audit_monthly_reviews AFTER INSERT OR UPDATE OR DELETE ON monthly_reviews
  FOR EACH ROW EXECUTE FUNCTION log_audit();

-- ============================================
-- RPC: Get user context helper
-- ============================================
CREATE OR REPLACE FUNCTION get_user_context()
RETURNS TABLE(
  user_id UUID,
  role user_role,
  unit_id UUID,
  unit_type unit_type,
  assigned_units UUID[],
  active_delegations UUID[]
) LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    p.id,
    p.role,
    p.unit_id,
    u.type,
    ARRAY(
      SELECT ua.unit_id FROM unit_assignments ua WHERE ua.user_id = p.id
    ),
    ARRAY(
      SELECT d.delegate_id FROM delegations d
      WHERE d.delegator_id = p.id
        AND d.status = 'active'
        AND d.starts_at <= now()
        AND d.ends_at >= now()
    )
  FROM profiles p
  JOIN units u ON u.id = p.unit_id
  WHERE p.id = auth.uid();
$$;
