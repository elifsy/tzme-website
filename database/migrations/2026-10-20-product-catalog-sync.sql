-- Align the existing product catalog with all pages of https://www.tzmeglobal.com/products.
-- Retire surplus products using the CMS deletion status; preserve retained product copy and photos.
-- Run once, so subsequent administrator additions, edits and selections remain possible.
SET NAMES utf8mb4;
START TRANSACTION;
UPDATE site_content AS target JOIN site_content AS legacy ON legacy.id='material-handling' AND legacy.type='products'
SET target.show_on_home=1, target.home_order=legacy.home_order
WHERE target.id='ship-unloader' AND target.type='products' AND target.status='published' AND COALESCE(target.show_on_home,0)=0 AND legacy.show_on_home=1 AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-official-catalog-sync-v1');
UPDATE site_settings SET configuration=JSON_SET(configuration,'$.products."ship-unloader"',JSON_EXTRACT(configuration,'$.products."material-handling"'))
WHERE id='home-solutions' AND JSON_VALID(configuration) AND JSON_CONTAINS_PATH(configuration,'one','$.products."material-handling"') AND NOT JSON_CONTAINS_PATH(configuration,'one','$.products."ship-unloader"') AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-official-catalog-sync-v1');
UPDATE site_settings SET configuration=JSON_REMOVE(configuration,'$.products."material-handling"') WHERE id='home-solutions' AND JSON_VALID(configuration) AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-official-catalog-sync-v1');
UPDATE site_content SET status='deleted',show_on_home=0 WHERE type='products' AND id='material-handling' AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-official-catalog-sync-v1');
UPDATE site_content AS target JOIN site_content AS legacy ON legacy.id='mining-equipment' AND legacy.type='products'
SET target.show_on_home=1, target.home_order=legacy.home_order
WHERE target.id='bucket-wheel-excavator' AND target.type='products' AND target.status='published' AND COALESCE(target.show_on_home,0)=0 AND legacy.show_on_home=1 AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-official-catalog-sync-v1');
UPDATE site_settings SET configuration=JSON_SET(configuration,'$.products."bucket-wheel-excavator"',JSON_EXTRACT(configuration,'$.products."mining-equipment"'))
WHERE id='home-solutions' AND JSON_VALID(configuration) AND JSON_CONTAINS_PATH(configuration,'one','$.products."mining-equipment"') AND NOT JSON_CONTAINS_PATH(configuration,'one','$.products."bucket-wheel-excavator"') AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-official-catalog-sync-v1');
UPDATE site_settings SET configuration=JSON_REMOVE(configuration,'$.products."mining-equipment"') WHERE id='home-solutions' AND JSON_VALID(configuration) AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-official-catalog-sync-v1');
UPDATE site_content SET status='deleted',show_on_home=0 WHERE type='products' AND id='mining-equipment' AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-official-catalog-sync-v1');
UPDATE site_content AS target JOIN site_content AS legacy ON legacy.id='port-machinery' AND legacy.type='products'
SET target.show_on_home=1, target.home_order=legacy.home_order
WHERE target.id='bulk-ship-loader' AND target.type='products' AND target.status='published' AND COALESCE(target.show_on_home,0)=0 AND legacy.show_on_home=1 AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-official-catalog-sync-v1');
UPDATE site_settings SET configuration=JSON_SET(configuration,'$.products."bulk-ship-loader"',JSON_EXTRACT(configuration,'$.products."port-machinery"'))
WHERE id='home-solutions' AND JSON_VALID(configuration) AND JSON_CONTAINS_PATH(configuration,'one','$.products."port-machinery"') AND NOT JSON_CONTAINS_PATH(configuration,'one','$.products."bulk-ship-loader"') AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-official-catalog-sync-v1');
UPDATE site_settings SET configuration=JSON_REMOVE(configuration,'$.products."port-machinery"') WHERE id='home-solutions' AND JSON_VALID(configuration) AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-official-catalog-sync-v1');
UPDATE site_content SET status='deleted',show_on_home=0 WHERE type='products' AND id='port-machinery' AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-official-catalog-sync-v1');
UPDATE site_content AS target JOIN site_content AS legacy ON legacy.id='bridge-equipment' AND legacy.type='products'
SET target.show_on_home=1, target.home_order=legacy.home_order
WHERE target.id='bridge-erection-machine' AND target.type='products' AND target.status='published' AND COALESCE(target.show_on_home,0)=0 AND legacy.show_on_home=1 AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-official-catalog-sync-v1');
UPDATE site_settings SET configuration=JSON_SET(configuration,'$.products."bridge-erection-machine"',JSON_EXTRACT(configuration,'$.products."bridge-equipment"'))
WHERE id='home-solutions' AND JSON_VALID(configuration) AND JSON_CONTAINS_PATH(configuration,'one','$.products."bridge-equipment"') AND NOT JSON_CONTAINS_PATH(configuration,'one','$.products."bridge-erection-machine"') AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-official-catalog-sync-v1');
UPDATE site_settings SET configuration=JSON_REMOVE(configuration,'$.products."bridge-equipment"') WHERE id='home-solutions' AND JSON_VALID(configuration) AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-official-catalog-sync-v1');
UPDATE site_content SET status='deleted',show_on_home=0 WHERE type='products' AND id='bridge-equipment' AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-official-catalog-sync-v1');
UPDATE site_content AS target JOIN site_content AS legacy ON legacy.id='metallurgy' AND legacy.type='products'
SET target.show_on_home=1, target.home_order=legacy.home_order
WHERE target.id='electric-furnace' AND target.type='products' AND target.status='published' AND COALESCE(target.show_on_home,0)=0 AND legacy.show_on_home=1 AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-official-catalog-sync-v1');
UPDATE site_settings SET configuration=JSON_SET(configuration,'$.products."electric-furnace"',JSON_EXTRACT(configuration,'$.products."metallurgy"'))
WHERE id='home-solutions' AND JSON_VALID(configuration) AND JSON_CONTAINS_PATH(configuration,'one','$.products."metallurgy"') AND NOT JSON_CONTAINS_PATH(configuration,'one','$.products."electric-furnace"') AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-official-catalog-sync-v1');
UPDATE site_settings SET configuration=JSON_REMOVE(configuration,'$.products."metallurgy"') WHERE id='home-solutions' AND JSON_VALID(configuration) AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-official-catalog-sync-v1');
UPDATE site_content SET status='deleted',show_on_home=0 WHERE type='products' AND id='metallurgy' AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-official-catalog-sync-v1');
UPDATE site_content AS target JOIN site_content AS legacy ON legacy.id='environmental' AND legacy.type='products'
SET target.show_on_home=1, target.home_order=legacy.home_order
WHERE target.id='sedimentation-tank' AND target.type='products' AND target.status='published' AND COALESCE(target.show_on_home,0)=0 AND legacy.show_on_home=1 AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-official-catalog-sync-v1');
UPDATE site_settings SET configuration=JSON_SET(configuration,'$.products."sedimentation-tank"',JSON_EXTRACT(configuration,'$.products."environmental"'))
WHERE id='home-solutions' AND JSON_VALID(configuration) AND JSON_CONTAINS_PATH(configuration,'one','$.products."environmental"') AND NOT JSON_CONTAINS_PATH(configuration,'one','$.products."sedimentation-tank"') AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-official-catalog-sync-v1');
UPDATE site_settings SET configuration=JSON_REMOVE(configuration,'$.products."environmental"') WHERE id='home-solutions' AND JSON_VALID(configuration) AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-official-catalog-sync-v1');
UPDATE site_content SET status='deleted',show_on_home=0 WHERE type='products' AND id='environmental' AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-official-catalog-sync-v1');
UPDATE site_content AS target JOIN site_content AS legacy ON legacy.id='custom-engineering' AND legacy.type='products'
SET target.show_on_home=1, target.home_order=legacy.home_order
WHERE target.id='offshore-pipeline-structure' AND target.type='products' AND target.status='published' AND COALESCE(target.show_on_home,0)=0 AND legacy.show_on_home=1 AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-official-catalog-sync-v1');
UPDATE site_settings SET configuration=JSON_SET(configuration,'$.products."offshore-pipeline-structure"',JSON_EXTRACT(configuration,'$.products."custom-engineering"'))
WHERE id='home-solutions' AND JSON_VALID(configuration) AND JSON_CONTAINS_PATH(configuration,'one','$.products."custom-engineering"') AND NOT JSON_CONTAINS_PATH(configuration,'one','$.products."offshore-pipeline-structure"') AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-official-catalog-sync-v1');
UPDATE site_settings SET configuration=JSON_REMOVE(configuration,'$.products."custom-engineering"') WHERE id='home-solutions' AND JSON_VALID(configuration) AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-official-catalog-sync-v1');
UPDATE site_content SET status='deleted',show_on_home=0 WHERE type='products' AND id='custom-engineering' AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-official-catalog-sync-v1');
UPDATE site_content AS target JOIN site_content AS legacy ON legacy.id='tourism' AND legacy.type='products'
SET target.show_on_home=1, target.home_order=legacy.home_order
WHERE target.id='ferris-wheel' AND target.type='products' AND target.status='published' AND COALESCE(target.show_on_home,0)=0 AND legacy.show_on_home=1 AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-official-catalog-sync-v1');
UPDATE site_settings SET configuration=JSON_SET(configuration,'$.products."ferris-wheel"',JSON_EXTRACT(configuration,'$.products."tourism"'))
WHERE id='home-solutions' AND JSON_VALID(configuration) AND JSON_CONTAINS_PATH(configuration,'one','$.products."tourism"') AND NOT JSON_CONTAINS_PATH(configuration,'one','$.products."ferris-wheel"') AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-official-catalog-sync-v1');
UPDATE site_settings SET configuration=JSON_REMOVE(configuration,'$.products."tourism"') WHERE id='home-solutions' AND JSON_VALID(configuration) AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-official-catalog-sync-v1');
UPDATE site_content SET status='deleted',show_on_home=0 WHERE type='products' AND id='tourism' AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-official-catalog-sync-v1');
UPDATE site_content AS target JOIN site_content AS legacy ON legacy.id='grab-ship-unloader' AND legacy.type='products'
SET target.show_on_home=1, target.home_order=legacy.home_order
WHERE target.id='ship-unloader' AND target.type='products' AND target.status='published' AND COALESCE(target.show_on_home,0)=0 AND legacy.show_on_home=1 AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-official-catalog-sync-v1');
UPDATE site_settings SET configuration=JSON_SET(configuration,'$.products."ship-unloader"',JSON_EXTRACT(configuration,'$.products."grab-ship-unloader"'))
WHERE id='home-solutions' AND JSON_VALID(configuration) AND JSON_CONTAINS_PATH(configuration,'one','$.products."grab-ship-unloader"') AND NOT JSON_CONTAINS_PATH(configuration,'one','$.products."ship-unloader"') AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-official-catalog-sync-v1');
UPDATE site_settings SET configuration=JSON_REMOVE(configuration,'$.products."grab-ship-unloader"') WHERE id='home-solutions' AND JSON_VALID(configuration) AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-official-catalog-sync-v1');
UPDATE site_content SET status='deleted',show_on_home=0 WHERE type='products' AND id='grab-ship-unloader' AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-official-catalog-sync-v1');
UPDATE site_content AS target JOIN site_content AS legacy ON legacy.id='pipe-rack' AND legacy.type='products'
SET target.show_on_home=1, target.home_order=legacy.home_order
WHERE target.id='offshore-pipeline-structure' AND target.type='products' AND target.status='published' AND COALESCE(target.show_on_home,0)=0 AND legacy.show_on_home=1 AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-official-catalog-sync-v1');
UPDATE site_settings SET configuration=JSON_SET(configuration,'$.products."offshore-pipeline-structure"',JSON_EXTRACT(configuration,'$.products."pipe-rack"'))
WHERE id='home-solutions' AND JSON_VALID(configuration) AND JSON_CONTAINS_PATH(configuration,'one','$.products."pipe-rack"') AND NOT JSON_CONTAINS_PATH(configuration,'one','$.products."offshore-pipeline-structure"') AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-official-catalog-sync-v1');
UPDATE site_settings SET configuration=JSON_REMOVE(configuration,'$.products."pipe-rack"') WHERE id='home-solutions' AND JSON_VALID(configuration) AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-official-catalog-sync-v1');
UPDATE site_content SET status='deleted',show_on_home=0 WHERE type='products' AND id='pipe-rack' AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-official-catalog-sync-v1');
UPDATE site_settings SET configuration=JSON_REMOVE(configuration,'$.products."rotor-sail"') WHERE id='home-solutions' AND JSON_VALID(configuration) AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-official-catalog-sync-v1');
UPDATE site_content SET status='deleted',show_on_home=0 WHERE type='products' AND id='rotor-sail' AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-official-catalog-sync-v1');
UPDATE site_settings SET configuration=JSON_SET(configuration,'$.overview.featuredProducts[0]','ship-unloader')
WHERE id='product-showcase' AND JSON_VALID(configuration) AND JSON_UNQUOTE(JSON_EXTRACT(configuration,'$.overview.featuredProducts[0]'))='grab-ship-unloader' AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-official-catalog-sync-v1');
UPDATE site_settings SET configuration=JSON_SET(configuration,'$.overview.hotspots[2].productId','ship-unloader')
WHERE id='product-showcase' AND JSON_VALID(configuration) AND JSON_UNQUOTE(JSON_EXTRACT(configuration,'$.overview.hotspots[2].productId'))='grab-ship-unloader' AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-official-catalog-sync-v1');
INSERT INTO app_migrations (id) SELECT '2026-10-20-official-catalog-sync-v1' WHERE NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-20-official-catalog-sync-v1');
COMMIT;
