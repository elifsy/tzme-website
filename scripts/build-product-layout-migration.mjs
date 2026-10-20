import { mkdirSync, writeFileSync } from 'node:fs'

const sql = `-- Optional product detail layout override. Auto follows the equipment image silhouette.
-- Existing product text, images, selections and later layout choices are preserved.
SET NAMES utf8mb4;
SET @tzme_layout_column_exists = EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='site_content' AND column_name='detail_layout');
SET @tzme_layout_sql = IF(@tzme_layout_column_exists, 'SELECT 1', 'ALTER TABLE site_content ADD COLUMN detail_layout VARCHAR(24) NULL DEFAULT ''auto'' COMMENT ''产品详情布局：auto 自动、vertical 纵向、panorama 全景、exhibit 侧边、platform 上图下文'' AFTER presentation_image');
PREPARE tzme_layout_statement FROM @tzme_layout_sql;
EXECUTE tzme_layout_statement;
DEALLOCATE PREPARE tzme_layout_statement;
INSERT INTO app_migrations (id) SELECT '2026-10-20-product-layout-v1' WHERE NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-product-layout-v1');
`
mkdirSync('database/migrations', { recursive: true })
writeFileSync('database/migrations/2026-10-20-product-layout.sql', sql)
writeFileSync('server/src/main/resources/db/21-product-layout-schema.sql', sql)
console.log('Built optional product detail layout migration.')
