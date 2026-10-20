-- Optional product detail stage image. Existing content is preserved.
SET NAMES utf8mb4;
SET @tzme_presentation_column_exists = EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='site_content' AND column_name='presentation_image');
SET @tzme_presentation_sql = IF(@tzme_presentation_column_exists, 'SELECT 1', 'ALTER TABLE site_content ADD COLUMN presentation_image VARCHAR(1000) NULL COMMENT ''产品详情页设备展示图，建议透明背景；留空使用封面原图'' AFTER image');
PREPARE tzme_presentation_statement FROM @tzme_presentation_sql;
EXECUTE tzme_presentation_statement;
DEALLOCATE PREPARE tzme_presentation_statement;

-- Seed the approved equipment cutout once, keeping original photos and administrator changes.
SET NAMES utf8mb4;
START TRANSACTION;
UPDATE site_content SET presentation_image='/assets/tzme-j/products/presentation/grab-unloader.webp'
WHERE type='products' AND id='grab-ship-unloader'
  AND image='/assets/tzme-j/products/grab-unloader.jpg' AND (presentation_image IS NULL OR presentation_image='')
  AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-19-product-presentation-v1');
INSERT INTO app_migrations (id) SELECT '2026-10-19-product-presentation-v1' WHERE NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-19-product-presentation-v1');
COMMIT;
