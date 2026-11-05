-- Tutorial activation is independent for each account and sidebar function.
CREATE TABLE IF NOT EXISTS admin_tutorial_progress (
 id VARCHAR(100) NOT NULL PRIMARY KEY,
 account_id VARCHAR(36) NOT NULL,
 module_key VARCHAR(40) NOT NULL,
 seen_at DATETIME(6) NOT NULL,
 CONSTRAINT uk_tutorial_account_module UNIQUE (account_id, module_key)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
