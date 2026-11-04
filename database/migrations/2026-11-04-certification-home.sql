-- Run after certificate seeds. Preserve all subsequent administrator choices.
SET NAMES utf8mb4;
SET @tzme_cert_home_column_exists = EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='certifications' AND column_name='show_on_home');
SET @tzme_cert_home_sql = IF(@tzme_cert_home_column_exists, 'SELECT 1', 'ALTER TABLE certifications ADD COLUMN show_on_home BOOLEAN NOT NULL DEFAULT FALSE COMMENT ''是否选择在首页展示，实际展示还需已发布且有证书文件''');
PREPARE tzme_cert_home_statement FROM @tzme_cert_home_sql;
EXECUTE tzme_cert_home_statement;
DEALLOCATE PREPARE tzme_cert_home_statement;

START TRANSACTION;
UPDATE certifications SET show_on_home = TRUE
WHERE id IN ('iso-9001', 'iso-14001', 'iso-45001', 'en-1090-2', 'iso-3834')
  AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-11-04-certification-home-v1');
INSERT INTO app_migrations (id) SELECT '2026-11-04-certification-home-v1'
WHERE NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-11-04-certification-home-v1');
COMMIT;
