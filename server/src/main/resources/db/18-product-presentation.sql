-- Seed the approved equipment cutout once, keeping original photos and administrator changes.
SET NAMES utf8mb4;
START TRANSACTION;
UPDATE site_content SET presentation_image='/assets/tzme-j/products/presentation/grab-unloader.webp'
WHERE type='products' AND id='grab-ship-unloader'
  AND image='/assets/tzme-j/products/grab-unloader.jpg' AND (presentation_image IS NULL OR presentation_image='')
  AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-19-product-presentation-v1');
INSERT INTO app_migrations (id) SELECT '2026-10-19-product-presentation-v1' WHERE NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-19-product-presentation-v1');
COMMIT;
