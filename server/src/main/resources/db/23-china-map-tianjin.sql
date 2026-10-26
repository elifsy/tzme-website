-- Anchor the China preset and selected marker at Tianjin.
-- Update coordinates only, once; later backend edits remain editable.
SET NAMES utf8mb4;
START TRANSACTION;
UPDATE site_settings SET configuration=JSON_SET(configuration,REPLACE(JSON_UNQUOTE(JSON_SEARCH(configuration,'one','country-CN',NULL,'$.mapCountries[*].id')),'.id','.x'),81.253,REPLACE(JSON_UNQUOTE(JSON_SEARCH(configuration,'one','country-CN',NULL,'$.mapCountries[*].id')),'.id','.y'),33.104) WHERE id='website' AND JSON_UNQUOTE(JSON_SEARCH(configuration,'one','country-CN',NULL,'$.mapCountries[*].id')) IS NOT NULL AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-22-china-map-tianjin-v1');
UPDATE home_global_settings SET configuration=JSON_SET(configuration,REPLACE(JSON_UNQUOTE(JSON_SEARCH(configuration,'one','country-CN',NULL,'$.mapPoints[*].id')),'.id','.x'),81.253,REPLACE(JSON_UNQUOTE(JSON_SEARCH(configuration,'one','country-CN',NULL,'$.mapPoints[*].id')),'.id','.y'),33.104) WHERE id=1 AND JSON_UNQUOTE(JSON_SEARCH(configuration,'one','country-CN',NULL,'$.mapPoints[*].id')) IS NOT NULL AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-22-china-map-tianjin-v1');
INSERT INTO app_migrations (id) SELECT '2026-10-22-china-map-tianjin-v1' WHERE NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-22-china-map-tianjin-v1');
COMMIT;
