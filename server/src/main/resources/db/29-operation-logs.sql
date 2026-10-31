-- Append-only operation history. Actor snapshots remain after accounts are renamed/deleted.
-- Request/response bodies, passwords, SMTP secrets and file contents are never stored.
CREATE TABLE IF NOT EXISTS admin_operation_logs (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  request_id VARCHAR(36) NOT NULL,
  created_at DATETIME(6) NOT NULL,
  actor_id VARCHAR(36) NULL,
  username VARCHAR(64) NOT NULL,
  display_name VARCHAR(64) NOT NULL,
  role VARCHAR(24) NOT NULL,
  module VARCHAR(40) NOT NULL,
  action VARCHAR(32) NOT NULL,
  target_id VARCHAR(180) NOT NULL,
  target_name VARCHAR(255) NOT NULL,
  summary VARCHAR(500) NOT NULL,
  success BOOLEAN NOT NULL,
  status_code INT NOT NULL,
  result_message VARCHAR(80) NOT NULL,
  method VARCHAR(10) NOT NULL,
  path VARCHAR(500) NOT NULL,
  address VARCHAR(64) NOT NULL,
  duration_ms BIGINT NOT NULL,
  INDEX idx_operation_time (created_at, id),
  INDEX idx_operation_actor_time (actor_id, created_at),
  INDEX idx_operation_module_time (module, created_at)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
