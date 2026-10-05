# TZME Corporate Website and CMS

## Frontend

- Vue 3 + Vite + Vue Router + Element Plus + Vue I18n. The public site and admin workspace both use Element Plus components.
- Public routes: `/`, `/solutions`, `/solutions/:id`, `/about`, `/insights`, `/insights/:id`, `/contact`. The older `/solutions/:category/:id` route also opens the matching product.
- Admin: `/admin` (overview), `/admin/products`, `/admin/industries`, `/admin/articles`, `/admin/certifications`, `/admin/inquiries`
- Start frontend: `npm install` then `npm run dev`
- Production build: `npm run build`

The six public page templates are implemented separately in `src/views/` and follow the supplied reference `index.html`. Its original page styles are in `src/style/design-reference.css`; `src/style/design-adapter.css` adapts them to full browser pages, Element Plus controls, and smaller screens. Shared navigation and inquiry behaviour is in `src/composables/useDesignPage.js`.

Use **EN / 中** in the public header, mobile menu, or admin top bar to switch languages. The choice is remembered in the browser. The editor has English and Chinese tabs for titles, categories, descriptions, and article bodies; both titles are required. Existing English records remain readable and can be completed with Chinese copy. MySQL adds the bilingual columns through Hibernate's `ddl-auto=update` setting when the Java service next starts. Managed product cards and news records use the selected language; older records fall back to English until translated.

The Certifications page maintains English and Chinese certificate names, descriptions and issuers, plus certificate number, dates, image path, display order and publication status. Its four initial records match the About page. Published records appear there in display order. The API stores certifications in MySQL when the Java service is running; otherwise edits remain in this browser's local storage.

The Products page and the homepage “Our solutions” section read the same product records. Every published product has its own `/solutions/:id` detail page. In `/admin/products`, editors can maintain the title, category, summary, image, full description, feature list and product information in English and Chinese. Feature lists use one line per item; product information uses `Label: value` on each line. The Homepage switch selects which published products appear on the homepage, and the display order field controls their order. At most **5** products can be selected; the admin shows the current count and prevents selecting a sixth. The Java API also enforces a five product limit on persisted records.

Each product can belong to multiple industries. `/admin/industries` lets editors add industries with English and Chinese names and subtitles, set their display order, and publish or unpublish them. Published industries automatically appear in the homepage “Industries” section and the product center filters. Homepage industry links open `/solutions?industry=<id>` with the matching filter selected; products appear under every industry assigned to them. The five original industries and existing product assignments are retained as initial data. A product must have at least one industry before it can be saved. Industry records and product associations are stored in MySQL when the Java service is running.

Interface text uses `$t('site.key')` and `$t('admin.key')` in Vue templates. English and Chinese messages live in `src/i18n/locales/en.js` and `src/i18n/locales/zh.js`. To add another interface language, copy one locale file, translate its values, and register the new code, labels, HTML language tag, and messages in `src/i18n/locales/index.js`. The public and admin language switchers then show the new option automatically. Managed product and article records currently store English and Chinese fields; other interface languages display the English record fields until content storage is extended.

## News and rich text editing

The news category filter follows the product center's Element Plus button layout. Categories are collected automatically from published articles' English and Chinese category fields; adding a published article with a new category adds a filter option. Filtering updates the featured story, list, count and pagination, and starts at page 1. The category and page are stored in the URL and retained when returning from a detail page. Previous/next navigation stays within the selected category. Switching interface language keeps the current category selected.

The news page reads published articles from the CMS, orders them by publication date, and uses Element Plus pagination with **6 articles per page**. Both the featured story and list rows open `/insights/:id`. The detail page shows the selected language's title, summary, cover image and formatted body, with an automatic heading directory and previous/next article links. Returning to the list preserves the page number. Drafts do not appear on the public site.

In `/admin/articles`, the English and Chinese body fields use wangEditor. Editors can format headings, colors, lists, alignment, quotes, links and tables, paste formatted text, and insert images by URL or upload. Plain text from older records is converted into paragraphs. Article HTML is sanitized when opened, saved and displayed. The publication date is editable and controls list ordering.

Image uploads require the Java backend to be running. Supported formats are JPEG, PNG, GIF and WebP, with a **5 MB** limit per image. Files are saved under `server/uploads` when using `server/run.ps1`; set `TZME_UPLOAD_DIR` to choose another persistent directory. Keep this directory when redeploying or backing up the website. Vite's existing `/api` proxy serves the images during development; production hosting must also forward `/api` to Java. Restart the Java service after this update to enable uploads and migrate the three body columns to MySQL `LONGTEXT` without removing existing content.

## Java API

Java 17 / Spring Boot 3 / Spring Data JPA / MySQL 8.4. The local database is `tzme_corporate`; the app connects as `tzme_app` using the user-level `TZME_DB_USER` and `TZME_DB_PASSWORD` variables. Start MySQL in PowerShell with `& 'C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe' "--defaults-file=$env:LOCALAPPDATA\MySQL84\my.ini" --console`, then start the API from `server` with `.\run.ps1`. The script reloads saved user environment variables into the current terminal before starting Spring Boot. API runs on port 8080; Vite proxies `/api` requests while developing. MySQL listens only on localhost and stores data in `%LOCALAPPDATA%\MySQL84\Data`. The current Windows account could not register a Windows service, so MySQL will need to be started again after a reboot.

## API routes

- `GET/POST /api/products`, `PUT/DELETE /api/products/{id}`
- `GET/POST /api/articles`, `PUT/DELETE /api/articles/{id}`
- `POST /api/uploads/images` (multipart field `file`), `GET /api/uploads/images/{filename}`
- `GET/POST /api/certifications`, `PUT/DELETE /api/certifications/{id}`
- `GET/POST /api/industries`, `PUT/DELETE /api/industries/{id}`
- `GET/POST /api/inquiries`, `PUT /api/inquiries/{id}`

When the API is unavailable, the admin can still edit content using browser local storage. This is a development fallback, not shared persistence. Seed records are included in `src/data/content.js`. The public page copy follows the supplied reference layout.

## Note

The admin workspace is currently a content management starter and does not yet implement user login/authorization. Configure authentication before exposing write APIs to a public network.



& 'C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe' "--defaults-file=$env:LOCALAPPDATA\MySQL84\my.ini" --console


cd D:\WorkBuddyData\2026-09-21-10-54-57\tzme-ui-corporate\server
mvn spring-boot:run


cd D:\WorkBuddyData\2026-09-21-10-54-57\tzme-ui-corporate
npm run dev
