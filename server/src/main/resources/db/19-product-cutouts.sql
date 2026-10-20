-- Transparent equipment presentation images for the retained official product catalog.
-- Original covers, business copy, future administrator replacements and explicit clears are preserved.
SET NAMES utf8mb4;
START TRANSACTION;
UPDATE site_content SET presentation_image='/assets/tzme-j/products/presentation/conveying-cutout.webp'
WHERE type='products' AND id='conveying' AND image='/assets/tzme-j/products/belt-conveyor.jpg'
  AND (presentation_image IS NULL OR presentation_image='')
  AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-product-cutouts-v1');
UPDATE site_content SET presentation_image='/assets/tzme-j/products/presentation/spreader-cutout.webp'
WHERE type='products' AND id='spreader' AND image='/assets/tzme-products/spreader.webp'
  AND (presentation_image IS NULL OR presentation_image='')
  AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-product-cutouts-v1');
UPDATE site_content SET presentation_image='/assets/tzme-j/products/presentation/bucket-wheel-excavator-cutout.webp'
WHERE type='products' AND id='bucket-wheel-excavator' AND image='/assets/tzme-products/bucket-wheel-excavator.webp'
  AND (presentation_image IS NULL OR presentation_image='')
  AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-product-cutouts-v1');
UPDATE site_content SET presentation_image='/assets/tzme-j/products/presentation/stacker-reclaimer-cutout.webp'
WHERE type='products' AND id='stacker-reclaimer' AND image='/assets/tzme-products/stacker-reclaimer.webp'
  AND (presentation_image IS NULL OR presentation_image='')
  AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-product-cutouts-v1');
UPDATE site_content SET presentation_image='/assets/tzme-j/products/presentation/crushing-station-cutout.webp'
WHERE type='products' AND id='crushing-station' AND image='/assets/tzme-products/crushing-station.webp'
  AND (presentation_image IS NULL OR presentation_image='')
  AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-product-cutouts-v1');
UPDATE site_content SET presentation_image='/assets/tzme-j/products/presentation/flotation-machine-cutout.webp'
WHERE type='products' AND id='flotation-machine' AND image='/assets/tzme-products/flotation-machine.webp'
  AND (presentation_image IS NULL OR presentation_image='')
  AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-product-cutouts-v1');
UPDATE site_content SET presentation_image='/assets/tzme-j/products/presentation/thickener-cutout.webp'
WHERE type='products' AND id='thickener' AND image='/assets/tzme-products/thickener.webp'
  AND (presentation_image IS NULL OR presentation_image='')
  AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-product-cutouts-v1');
UPDATE site_content SET presentation_image='/assets/tzme-j/products/presentation/bulk-ship-loader-cutout.webp'
WHERE type='products' AND id='bulk-ship-loader' AND image='/assets/tzme-products/bulk-ship-loader.webp'
  AND (presentation_image IS NULL OR presentation_image='')
  AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-product-cutouts-v1');
UPDATE site_content SET presentation_image='/assets/tzme-j/products/presentation/grab-unloader.webp'
WHERE type='products' AND id='ship-unloader' AND image='/assets/tzme-products/ship-unloader.webp'
  AND (presentation_image IS NULL OR presentation_image='')
  AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-product-cutouts-v1');
UPDATE site_content SET presentation_image='/assets/tzme-j/products/presentation/ropeway-cutout.webp'
WHERE type='products' AND id='ropeway' AND image='/assets/tzme-products/ropeway.webp'
  AND (presentation_image IS NULL OR presentation_image='')
  AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-product-cutouts-v1');
UPDATE site_content SET presentation_image='/assets/tzme-j/products/presentation/roller-coaster-cutout.webp'
WHERE type='products' AND id='roller-coaster' AND image='/assets/tzme-products/roller-coaster.webp'
  AND (presentation_image IS NULL OR presentation_image='')
  AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-product-cutouts-v1');
UPDATE site_content SET presentation_image='/assets/tzme-j/products/presentation/ferris-wheel-cutout.webp'
WHERE type='products' AND id='ferris-wheel' AND image='/assets/tzme-products/ferris-wheel.webp'
  AND (presentation_image IS NULL OR presentation_image='')
  AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-product-cutouts-v1');
UPDATE site_content SET presentation_image='/assets/tzme-j/products/presentation/crane-cutout.webp'
WHERE type='products' AND id='crane' AND image='/assets/tzme-products/crane.webp'
  AND (presentation_image IS NULL OR presentation_image='')
  AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-product-cutouts-v1');
UPDATE site_content SET presentation_image='/assets/tzme-j/products/presentation/agv-cutout.webp'
WHERE type='products' AND id='agv' AND image='/assets/tzme-products/agv.webp'
  AND (presentation_image IS NULL OR presentation_image='')
  AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-product-cutouts-v1');
UPDATE site_content SET presentation_image='/assets/tzme-j/products/presentation/machinery-boom-cutout.webp'
WHERE type='products' AND id='machinery-boom' AND image='/assets/tzme-products/machinery-boom.webp'
  AND (presentation_image IS NULL OR presentation_image='')
  AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-product-cutouts-v1');
UPDATE site_content SET presentation_image='/assets/tzme-j/products/presentation/bridge-fabrication-machine-cutout.webp'
WHERE type='products' AND id='bridge-fabrication-machine' AND image='/assets/tzme-products/bridge-fabrication-machine.webp'
  AND (presentation_image IS NULL OR presentation_image='')
  AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-product-cutouts-v1');
UPDATE site_content SET presentation_image='/assets/tzme-j/products/presentation/bridge-erection-machine-cutout.webp'
WHERE type='products' AND id='bridge-erection-machine' AND image='/assets/tzme-products/bridge-erection-machine.webp'
  AND (presentation_image IS NULL OR presentation_image='')
  AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-product-cutouts-v1');
UPDATE site_content SET presentation_image='/assets/tzme-j/products/presentation/wind-tower-stacking-device-cutout.webp'
WHERE type='products' AND id='wind-tower-stacking-device' AND image='/assets/tzme-products/wind-tower-stacking-device.webp'
  AND (presentation_image IS NULL OR presentation_image='')
  AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-product-cutouts-v1');
UPDATE site_content SET presentation_image='/assets/tzme-j/products/presentation/offshore-pipe-piles-cutout.webp'
WHERE type='products' AND id='offshore-pipe-piles' AND image='/assets/tzme-products/offshore-pipe-piles.webp'
  AND (presentation_image IS NULL OR presentation_image='')
  AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-product-cutouts-v1');
UPDATE site_content SET presentation_image='/assets/tzme-j/products/presentation/cyclone-separator-cutout.webp'
WHERE type='products' AND id='cyclone-separator' AND image='/assets/tzme-products/cyclone-separator.webp'
  AND (presentation_image IS NULL OR presentation_image='')
  AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-product-cutouts-v1');
UPDATE site_content SET presentation_image='/assets/tzme-j/products/presentation/offshore-pipeline-structure-cutout.webp'
WHERE type='products' AND id='offshore-pipeline-structure' AND image='/assets/tzme-products/offshore-pipeline-structure.webp'
  AND (presentation_image IS NULL OR presentation_image='')
  AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-product-cutouts-v1');
UPDATE site_content SET presentation_image='/assets/tzme-j/products/presentation/sedimentation-tank-cutout.webp'
WHERE type='products' AND id='sedimentation-tank' AND image='/assets/tzme-products/sedimentation-tank.webp'
  AND (presentation_image IS NULL OR presentation_image='')
  AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-product-cutouts-v1');
UPDATE site_content SET presentation_image='/assets/tzme-j/products/presentation/water-storage-tank-cutout.webp'
WHERE type='products' AND id='water-storage-tank' AND image='/assets/tzme-products/water-storage-tank.webp'
  AND (presentation_image IS NULL OR presentation_image='')
  AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-product-cutouts-v1');
UPDATE site_content SET presentation_image='/assets/tzme-j/products/presentation/electric-furnace-cutout.webp'
WHERE type='products' AND id='electric-furnace' AND image='/assets/tzme-products/electric-furnace.webp'
  AND (presentation_image IS NULL OR presentation_image='')
  AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-product-cutouts-v1');
UPDATE site_content SET presentation_image='/assets/tzme-j/products/presentation/ausmelt-furnace-cutout.webp'
WHERE type='products' AND id='ausmelt-furnace' AND image='/assets/tzme-products/ausmelt-furnace.webp'
  AND (presentation_image IS NULL OR presentation_image='')
  AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-product-cutouts-v1');
UPDATE site_content SET presentation_image='/assets/tzme-j/products/presentation/bridge-steel-structure-cutout.webp'
WHERE type='products' AND id='bridge-steel-structure' AND image='/assets/tzme-products/bridge-steel-structure.webp'
  AND (presentation_image IS NULL OR presentation_image='')
  AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-product-cutouts-v1');
UPDATE site_content SET presentation_image='/assets/tzme-j/products/presentation/bulk-hopper-cutout.webp'
WHERE type='products' AND id='bulk-hopper' AND image='/assets/tzme-products/bulk-hopper.webp'
  AND (presentation_image IS NULL OR presentation_image='')
  AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-product-cutouts-v1');
UPDATE site_content SET presentation_image='/assets/tzme-j/products/presentation/paper-scanner-cutout.webp'
WHERE type='products' AND id='paper-scanner' AND image='/assets/tzme-products/paper-scanner.webp'
  AND (presentation_image IS NULL OR presentation_image='')
  AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-product-cutouts-v1');
UPDATE site_content SET presentation_image='/assets/tzme-j/products/presentation/mmi-house-cutout.webp'
WHERE type='products' AND id='mmi-house' AND image='/assets/tzme-products/mmi-house.webp'
  AND (presentation_image IS NULL OR presentation_image='')
  AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-product-cutouts-v1');
UPDATE site_content SET presentation_image='/assets/tzme-j/products/presentation/factory-building-module-cutout.webp'
WHERE type='products' AND id='factory-building-module' AND image='/assets/tzme-products/factory-building-module.webp'
  AND (presentation_image IS NULL OR presentation_image='')
  AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-product-cutouts-v1');
UPDATE site_content SET presentation_image='/assets/tzme-j/products/presentation/rotary-screen-cutout.webp'
WHERE type='products' AND id='rotary-screen' AND image='/assets/tzme-products/rotary-screen.webp'
  AND (presentation_image IS NULL OR presentation_image='')
  AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-product-cutouts-v1');
UPDATE site_content SET presentation_image='/assets/tzme-j/products/presentation/wagon-tippler-cutout.webp'
WHERE type='products' AND id='wagon-tippler' AND image='/assets/tzme-products/wagon-tippler.webp'
  AND (presentation_image IS NULL OR presentation_image='')
  AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-product-cutouts-v1');
UPDATE site_content SET presentation_image='/assets/tzme-j/products/presentation/feeder-cutout.webp'
WHERE type='products' AND id='feeder' AND image='/assets/tzme-products/feeder.webp'
  AND (presentation_image IS NULL OR presentation_image='')
  AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-product-cutouts-v1');
INSERT INTO app_migrations (id) SELECT '2026-10-20-product-cutouts-v1' WHERE NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-product-cutouts-v1');
COMMIT;
