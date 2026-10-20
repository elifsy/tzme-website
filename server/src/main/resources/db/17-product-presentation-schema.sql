-- Optional product detail stage image. Existing content is preserved.
SET NAMES utf8mb4;
SET @tzme_presentation_column_exists = EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='site_content' AND column_name='presentation_image');
SET @tzme_presentation_sql = IF(@tzme_presentation_column_exists, 'SELECT 1', 'ALTER TABLE site_content ADD COLUMN presentation_image VARCHAR(1000) NULL COMMENT ''产品详情页设备展示图，建议透明背景；留空使用封面原图'' AFTER image');
PREPARE tzme_presentation_statement FROM @tzme_presentation_sql;
EXECUTE tzme_presentation_statement;
DEALLOCATE PREPARE tzme_presentation_statement;
