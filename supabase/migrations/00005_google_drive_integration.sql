-- Migration 00005: Google Drive integration support
-- Ngay: 23/08/2026

-- ============================================
-- EDGE FUNCTION STATUS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS file_sync_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attachment_id UUID REFERENCES attachments(id) ON DELETE CASCADE,
  job_type VARCHAR(50) NOT NULL, -- 'upload', 'delete', 'sync'
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
  provider VARCHAR(50) NOT NULL, -- 'supabase', 'google_drive'
  external_id VARCHAR(500),
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- ============================================
-- GOOGLE DRIVE CONFIG TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS storage_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(50) NOT NULL UNIQUE,
  config_json JSONB NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Default Supabase Storage config
INSERT INTO storage_config (provider, config_json, is_active)
VALUES ('supabase', jsonb_build_object('bucket', 'attachments'), true)
ON CONFLICT (provider) DO NOTHING;

-- Indexes
CREATE INDEX idx_file_sync_jobs_status ON file_sync_jobs(status);
CREATE INDEX idx_file_sync_jobs_attachment_id ON file_sync_jobs(attachment_id);
