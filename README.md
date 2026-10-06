# TZME Corporate Website and CMS

## Frontend

- Vue 3 + Vite + Vue Router + Element Plus + Vue I18n. The public site and admin workspace both use Element Plus components.
- Public routes: `/`, `/solutions`, `/solutions/:id`, `/projects`, `/projects/:id`, `/about`, `/insights`, `/insights/:id`, `/contact`. The older `/solutions/:category/:id` route also opens the matching product.
- Admin: `/admin` (overview), `/admin/products`, `/admin/industries`, `/admin/projects`, `/admin/articles`, `/admin/certifications`, `/admin/inquiries`
- Start frontend: `npm install` then `npm run dev`
- Production build: `npm run build`

The public page templates are implemented separately in `src/views/` and follow the supplied reference `index.html`. Its original page styles are in `src/style/design-reference.css`; `src/style/design-adapter.css` adapts them to full browser pages, Element Plus controls, and smaller screens. All nine public views reuse `src/components/SiteNav.vue` for the header and mobile drawer. Use `<SiteNav />` for the standard navigation or `<SiteNav overlay />` for the transparent homepage navigation. Menu definitions, localized labels, active routes and navigation behaviour live in `src/composables/useSiteNavigation.js`, which also supplies the footer menus. Shared page actions and inquiry behaviour remain in `src/composables/useDesignPage.js`.

Use **EN / 中** in the public header, mobile menu, or admin top bar to switch languages. The choice is remembered in the browser. The editor has English and Chinese tabs for titles, categories, descriptions, and article bodies; both titles are required. Existing English records remain readable and can be completed with Chinese copy. MySQL adds the bilingual columns through Hibernate's `ddl-auto=update` setting when the Java service next starts. Managed product cards and news records use the selected language; older records fall back to English until translated.

The Certifications page maintains English and Chinese certificate names, descriptions and issuers, plus certificate number, dates, image path, display order and publication status. Its four initial records match the About page. Published records appear there in display order. The API stores certifications in MySQL when the Java service is running; otherwise edits remain in this browser's local storage.

The Products page and the homepage “Our solutions” section read the same product records. Every published product has its own `/solutions/:id` detail page. In `/admin/products`, editors can maintain the title, category, summary, image, full description, feature list and product information in English and Chinese. Feature lists use one line per item; product information uses `Label: value` on each line. The Homepage switch selects which published products appear on the homepage, and the display order field controls their order. At most **5** products can be selected; the admin shows the current count and prevents selecting a sixth. The Java API also enforces a five product limit on persisted records.

Each product can belong to multiple industries. `/admin/industries` lets editors add industries with English and Chinese names and subtitles, set their display order, and publish or unpublish them. Published industries automatically appear in the homepage “Industries” section and the product center filters. Homepage industry links open `/solutions?industry=<id>` with the matching filter selected; products appear under every industry assigned to them. The five original industries and existing product assignments are retained as initial data. A product must have at least one industry before it can be saved. Industry records and product associations are stored in MySQL when the Java service is running.

Interface text uses `$t('site.key')` and `$t('admin.key')` in Vue templates. English and Chinese messages live in `src/i18n/locales/en.js` and `src/i18n/locales/zh.js`. To add another interface language, copy one locale file, translate its values, and register the new code, labels, HTML language tag, and messages in `src/i18n/locales/index.js`. The public and admin language switchers then show the new option automatically. Managed product and article records currently store English and Chinese fields; other interface languages display the English record fields until content storage is extended.

## Real projects

The project list and detail pages use the site's navy, blue and orange palette and typography consistent with the other pages. Project card titles use a 16 px equivalent size, metric labels 12 px, metric values 14 px, and detail body text 16 px; all use relative units so browser text settings are respected. The homepage selected projects section uses a soft blue gray background and lightly tinted cards. Navigation, footer links, search labels, result counts, tags, actions and pagination use contrasting text and visible keyboard focus. A skip link moves focus to the main content; search reset restores input focus, and pagination moves focus to the updated list. Layouts stack on narrow screens and browser zoom, and reduced motion and Windows forced colors preferences are supported.

The project detail body uses a reading card on a blue gray background, with a separate contents card and navy enquiry card. Project rich text is displayed using the page's readable colors, font sizes and line height. CMS formatting remains stored, while color, background and size overrides are removed from the public project rendering. Headings are arranged under the page and article titles; the main content headings receive numbered markers and matching contents links that move keyboard focus to the selected section. The contents card is hidden when the body has no headings. Wide data tables receive a labeled region with keyboard focus and their own horizontal scroll area.

`/projects` lists all published projects using the homepage card design, with keyword search and Element Plus pagination (6 per page). Its intro shares the news page's count, title, spacing and responsive layout. Project action buttons use the same Element Plus styling as the news category filters. The navigation now includes Projects. The homepage “View all projects” link opens this page, and every project card opens its own `/projects/:id` detail page. The detail shows the selected language's name, tags, summary, cover, metrics and formatted body, plus links to other published projects. Returning to the list preserves the search and page number.

In `/admin/projects`, every card field can be edited: image path or uploaded cover, bilingual image alternative text, project name, industry and location tags, and the labels and values of all three metrics (capacity, technology and scope). The summary and rich text detail body are maintained separately in English and Chinese. The editor includes a live card preview in the selected editing language. Draft projects are hidden from all public pages. List order and homepage order are independent and sort in ascending order.

The homepage maintains its three card layout: choose up to **3** projects using “Show on homepage” and set their homepage order. Drafts retain their selection but do not appear on the website. Both the admin and Java API enforce the selection limit. To replace an initial featured project, first turn off its homepage selection, then select the replacement.

Restart the Java service after this update. Hibernate creates the `projects` table, and `ProjectSeedInitializer` imports the three existing homepage cards from `server/src/main/resources/projects-seed.json` only when their IDs do not exist. Subsequent restarts preserve edits and deletion markers. The frontend fallback seed lives in `src/data/projects.js`. With the backend running, project edits are saved to MySQL. If the backend is unavailable, the admin explicitly reports that changes are saved only in this browser; these pending edits remain local until saved again with the backend available. Cover and rich text image uploads use the existing `/api/uploads/images` endpoint and require the backend.

## News and rich text editing

The news category filter follows the product center's Element Plus button layout. Categories are collected automatically from published articles' English and Chinese category fields; adding a published article with a new category adds a filter option. Filtering updates the featured story, list, count and pagination, and starts at page 1. The category and page are stored in the URL and retained when returning from a detail page. Previous/next navigation stays within the selected category. Switching interface language keeps the current category selected.

The news page reads published articles from the CMS, orders them by publication date, and uses Element Plus pagination with **6 articles per page**. Both the featured story and list rows open `/insights/:id`. The detail page shows the selected language's title, summary, cover image and formatted body, with an automatic heading directory and previous/next article links. Returning to the list preserves the page number. Drafts do not appear on the public site.

In `/admin/articles`, the English and Chinese body fields use wangEditor. Editors can format headings, colors, lists, alignment, quotes, links and tables, paste formatted text, and insert images by URL or upload. Plain text from older records is converted into paragraphs. Article HTML is sanitized when opened, saved and displayed. The publication date is editable and controls list ordering.

Image uploads require the Java backend to be running. Supported formats are JPEG, PNG, GIF and WebP, with a **5 MB** limit per image. Files are saved under `server/uploads` when using `server/run.ps1`; set `TZME_UPLOAD_DIR` to choose another persistent directory. Keep this directory when redeploying or backing up the website. Vite's existing `/api` proxy serves the images during development; production hosting must also forward `/api` to Java. Restart the Java service after this update to enable uploads and migrate the three body columns to MySQL `LONGTEXT` without removing existing content.

## Homepage global reach settings

The About page's global reach section now uses the same `WorldReachMap` component and `/api/home-global` data as the homepage. Map mode, configured locations and bilingual names, image, alternative text, section label, titles, description and the three statistics are shared. Updating them in `/admin/global` updates both pages when refreshed. The homepage visibility switch and navigation button settings apply to the homepage; the About section keeps its existing placement before the footer.

`/admin/global` configures the homepage's global reach section: visibility, bilingual section label, two title lines, description, image alternative text, three statistic labels, map image, statistic values and optional suffixes, button visibility, bilingual button text and destination. Values and suffixes are shared between languages. The second title line can be left blank independently for each language. The editor includes a preview following the selected English or Chinese tab. All edits are applied together when saved.

The map has two display modes. In **Highlighted locations**, choose countries or regions in the searchable multi-select to highlight their preset locations. Search accepts English, Chinese and region codes. Click anywhere on the map to add a custom project location, or use the **Add custom location** button to add and focus a central marker with the keyboard. Click a marker or its tag to edit both names, or remove it. A focused marker can be moved with the arrow keys (hold Shift for larger steps) and removed with Delete or Backspace. The map supports up to **100** locations, validated by both the admin and Java API. The homepage and editor preview share the same dotted map and highlight renderer. Visitors can hover, click or focus markers to read the localized names; the complete location list is also exposed to screen readers. Map location count and the three manually edited business statistics are separate values.

In **Image** mode, maps can be uploaded as JPEG / PNG / GIF / WebP (up to 5 MB), using the existing image upload API, or set using a site path or HTTP(S) URL. A transparent PNG preserves the original dark background. Update both image descriptions to describe a replacement for screen reader users. Button destinations accept site paths, including queries and anchors, or complete HTTP(S) links. Switching modes preserves both the image and configured locations.

The interactive map uses a locally generated land silhouette with no political boundaries. Geographic data comes from [Natural Earth](https://www.naturalearthdata.com/about/terms-of-use/) (public domain). The SVG is `assets/world-dots.svg`; bilingual location presets are `src/data/mapCountries.json`. To regenerate these assets, download `ne_50m_admin_0_countries.geojson` from the source recorded in the JSON and run `node scripts/build-world-map.mjs <downloaded-file>`. The website does not fetch map data or tiles from a third party at runtime.

Restart the Java service after this update so Hibernate creates `home_global_settings` if needed and the API accepts map locations. `GET /api/home-global` reads the configuration; `PUT /api/home-global` validates and saves the complete bilingual configuration in MySQL, including display mode and named positions. Before the first save, both the API and frontend use `server/src/main/resources/home-global-defaults.json`, retaining the original homepage copy and starting with an unselected point map. Older saved configurations retain their content: the original `/assets/worldmap.png` defaults to the point map, while custom images retain image mode. Saved configuration survives service restarts.

The frontend caches only configurations read from or successfully saved to the API. When the backend is unavailable, it displays the last cache or defaults and reports this in the admin. A failed save leaves the form open and does not report success or publish local changes. Image uploads require the Java service; uploading alone does not publish the new image. After saving, refresh the public homepage to load the latest configuration.

## Java API

Java 17 / Spring Boot 3 / Spring Data JPA / MySQL 8.4. The local database is `tzme_corporate`; the app connects as `tzme_app` using the user-level `TZME_DB_USER` and `TZME_DB_PASSWORD` variables. Start MySQL in PowerShell with `& 'C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe' "--defaults-file=$env:LOCALAPPDATA\MySQL84\my.ini" --console`, then start the API from `server` with `.\run.ps1`. The script reloads saved user environment variables into the current terminal before starting Spring Boot. API runs on port 8080; Vite proxies `/api` requests while developing. MySQL listens only on localhost and stores data in `%LOCALAPPDATA%\MySQL84\Data`. The current Windows account could not register a Windows service, so MySQL will need to be started again after a reboot.

## API routes

- `GET/POST /api/products`, `PUT/DELETE /api/products/{id}`
- `GET/POST /api/articles`, `PUT/DELETE /api/articles/{id}`
- `POST /api/uploads/images` (multipart field `file`), `GET /api/uploads/images/{filename}`
- `GET/POST /api/certifications`, `PUT/DELETE /api/certifications/{id}`
- `GET/POST /api/industries`, `PUT/DELETE /api/industries/{id}`
- `GET/POST /api/projects`, `PUT/DELETE /api/projects/{id}`
- `GET/PUT /api/home-global`
- `GET/POST /api/inquiries`, `PUT /api/inquiries/{id}`

When the API is unavailable, the admin can still edit content using browser local storage. This is a development fallback, not shared persistence. Seed records are included in `src/data/content.js`. The public page copy follows the supplied reference layout.

## Note

The admin workspace is currently a content management starter and does not yet implement user login/authorization. Configure authentication before exposing write APIs to a public network.



& 'C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe' "--defaults-file=$env:LOCALAPPDATA\MySQL84\my.ini" --console


cd D:\WorkBuddyData\2026-09-21-10-54-57\tzme-ui-corporate\server
mvn spring-boot:run


cd D:\WorkBuddyData\2026-09-21-10-54-57\tzme-ui-corporate
npm run dev
