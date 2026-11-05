-- Remember tutorial activation per account, including when the user skips it.
SET @tzme_tutorial_column_exists = EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='admin_accounts' AND column_name='tutorial_seen_at');
SET @tzme_tutorial_sql = IF(@tzme_tutorial_column_exists, 'SELECT 1', 'ALTER TABLE admin_accounts ADD COLUMN tutorial_seen_at DATETIME(6) NULL COMMENT ''首次触发新手教程的时间，非空后不再自动触发''');
PREPARE tzme_tutorial_statement FROM @tzme_tutorial_sql;
EXECUTE tzme_tutorial_statement;
DEALLOCATE PREPARE tzme_tutorial_statement;
INSERT INTO app_migrations (id) SELECT '2026-11-04-admin-tutorial-v1'
WHERE NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-11-04-admin-tutorial-v1');
