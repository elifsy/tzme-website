-- Only a preset key is stored; changing an avatar never changes permissions.
SET @tzme_avatar_exists = EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='admin_accounts' AND column_name='avatar_key');
SET @tzme_avatar_sql = IF(@tzme_avatar_exists, 'SELECT 1', 'ALTER TABLE admin_accounts ADD COLUMN avatar_key VARCHAR(24) NULL DEFAULT ''engineer'' COMMENT ''后台账户虚拟形象预设''');
PREPARE tzme_avatar_statement FROM @tzme_avatar_sql;
EXECUTE tzme_avatar_statement;
DEALLOCATE PREPARE tzme_avatar_statement;
