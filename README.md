# TZME Corporate Website and CMS

## Frontend

- Vue 3 + Vite + Vue Router + Element Plus + Vue I18n. The public site and admin workspace both use Element Plus components.
- Public routes: `/`, `/solutions`, `/solutions/:category/:id`, `/about`, `/insights`, `/contact`
- Admin: `/admin` (overview), `/admin/products`, `/admin/articles`, `/admin/inquiries`
- Start frontend: `npm install` then `npm run dev`
- Production build: `npm run build`

The six public page templates are implemented separately in `src/views/` and follow the supplied reference `index.html`. Its original page styles are in `src/style/design-reference.css`; `src/style/design-adapter.css` adapts them to full browser pages, Element Plus controls, and smaller screens. Shared navigation and inquiry behaviour is in `src/composables/useDesignPage.js`.

Use **EN / 中** in the public header, mobile menu, or admin top bar to switch languages. The choice is remembered in the browser. The editor has English and Chinese tabs for titles, categories, descriptions, and article bodies; both titles are required. Existing English records remain readable and can be completed with Chinese copy. MySQL adds the bilingual columns through Hibernate's `ddl-auto=update` setting when the Java service next starts. Managed product cards and news records use the selected language; older records fall back to English until translated.

## Java API

Java 17 / Spring Boot 3 / Spring Data JPA / MySQL 8.4. The local database is `tzme_corporate`; the app connects as `tzme_app` using the user-level `TZME_DB_USER` and `TZME_DB_PASSWORD` variables. Start MySQL in PowerShell with `& 'C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe' "--defaults-file=$env:LOCALAPPDATA\MySQL84\my.ini" --console`, then start the API from `server` with `.\run.ps1`. The script reloads saved user environment variables into the current terminal before starting Spring Boot. API runs on port 8080; Vite proxies `/api` requests while developing. MySQL listens only on localhost and stores data in `%LOCALAPPDATA%\MySQL84\Data`. The current Windows account could not register a Windows service, so MySQL will need to be started again after a reboot.

## API routes

- `GET/POST /api/products`, `PUT/DELETE /api/products/{id}`
- `GET/POST /api/articles`, `PUT/DELETE /api/articles/{id}`
- `GET/POST /api/inquiries`, `PUT /api/inquiries/{id}`

When the API is unavailable, the admin can still edit content using browser local storage. This is a development fallback, not shared persistence. Seed records are included in `src/data/content.js`. The public page copy follows the supplied reference layout.

## Note

The admin workspace is currently a content management starter and does not yet implement user login/authorization. Configure authentication before exposing write APIs to a public network.



& 'C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe' "--defaults-file=$env:LOCALAPPDATA\MySQL84\my.ini" --console


cd D:\WorkBuddyData\2026-09-21-10-54-57\tzme-ui-corporate\server
mvn spring-boot:run


cd D:\WorkBuddyData\2026-09-21-10-54-57\tzme-ui-corporate
npm run dev
