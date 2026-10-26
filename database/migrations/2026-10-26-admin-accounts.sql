-- Account credentials are initialized from server environment variables, never seeded here.
CREATE TABLE IF NOT EXISTS admin_accounts (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  username VARCHAR(64) NOT NULL,
  display_name VARCHAR(64) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(24) NOT NULL,
  status VARCHAR(16) NOT NULL,
  must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
  auth_version BIGINT NOT NULL DEFAULT 0,
  revision BIGINT NOT NULL DEFAULT 0,
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  last_login_at DATETIME(6) NULL,
  CONSTRAINT uk_admin_username UNIQUE (username)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
