-- Article download files are independent of private customer inquiry attachments.
-- Idempotent schema addition; no existing content or classification is rewritten.
CREATE TABLE IF NOT EXISTS article_attachments (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  article_id VARCHAR(255) NULL,
  name VARCHAR(255) NOT NULL,
  extension VARCHAR(8) NOT NULL,
  size BIGINT NOT NULL,
  created_at DATETIME(6) NOT NULL,
  INDEX idx_article_attachments_article (article_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
