-- Add the existing manufacturing film once; preserve text, images and later video choices.
SET NAMES utf8mb4;
START TRANSACTION;
UPDATE site_settings SET configuration = JSON_SET(configuration, '$.home.video', '')
WHERE id='about-tzme' AND JSON_CONTAINS_PATH(configuration, 'one', '$.home.video')=0
  AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-11-04-about-intro-video-v1');
UPDATE site_settings SET configuration = JSON_SET(configuration, '$.about.video', '/assets/tzme-j/videos/greenland-aerial.mp4')
WHERE id='about-tzme' AND JSON_CONTAINS_PATH(configuration, 'one', '$.about.video')=0
  AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-11-04-about-intro-video-v1');
INSERT INTO app_migrations (id) SELECT '2026-11-04-about-intro-video-v1'
WHERE NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-11-04-about-intro-video-v1');
COMMIT;
