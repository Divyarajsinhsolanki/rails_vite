# Nexus Hub

Nexus Hub is a Rails 7.1 and React workspace for managing day-to-day product, project, and team operations. It has moved beyond the original sample-app stage and now includes authenticated dashboards, project and sprint planning, work logs, calendars, collaboration tools, knowledge cards, and PDF workflows.

The Rails app serves both the JSON API and the React entrypoint. Vite handles the React development server and production bundle.

## What It Does

- Authenticated workspace with Devise, JWT-backed session cookies, roles, profiles, settings, notifications, and optional Firebase Google sign-in.
- Project and sprint management with task boards, sprint logs, issue tracking, members, project settings, and project vault items.
- Work-log and momentum views for daily planning, priorities, tags, notes, meetings, and progress review.
- Team features for departments, skills, endorsements, posts, comments, likes, chat, and mentions.
- Calendar events, reminders, Google calendar links, ICS import/export, and deadline tracking.
- Knowledge dashboard with coding tips, news, words, phrases, bookmarks, reminders, and optional third-party API feeds.
- PDF Master tools for upload, edit, annotate, sign, watermark, stamp, merge, split, compress, encrypt, decrypt, protect, export, undo, and redo.
- Optional Google Sheets integration for sprint tasks, logs, and issue imports.
- Optional Keka integration for attendance and employee details.

## Tech Stack

- Ruby 3.3.0
- Rails 7.1
- PostgreSQL
- React 18
- Vite 6 with `vite_rails`
- Yarn 1.x
- Tailwind CSS
- Devise and `devise-jwt`
- Google API client, Firebase client/server token checks, Action Cable, Active Storage

## Requirements

- Ruby `3.3.0` (`.ruby-version`)
- Bundler compatible with `Gemfile.lock` (`4.0.6` is currently locked)
- Node `20.18.0` (`.node-version`)
- Yarn `1.22.x`
- PostgreSQL
- ImageMagick for image handling used by PDF flows
- Poppler utilities for PDF image export (`pdftoppm`)
- Access to the local `PdfMaster` gem used by the Rails development bundle
- Docker with Compose file support for version `3.8` if you plan to use the container setup

On Ubuntu/Debian, the system packages are typically:

```bash
sudo apt-get install postgresql libpq-dev imagemagick poppler-utils
```

## Local Setup

1. Configure the local `PdfMaster` gem path.

   The `Gemfile` currently points to a local PDF gem in development:

   ```ruby
   gem "PdfMaster", path: ENV.fetch("PDF_MASTER_PATH", "/home/divyarajs/rails_project/newgems/PdfMaster")
   ```

   If that default path does not exist on your machine, export the path before running Bundler or `bin/setup`:

   ```bash
   export PDF_MASTER_PATH=/absolute/path/to/PdfMaster
   ```

   This must be in the shell environment. Putting it only in `.env` is not enough for the first `bundle install`, because Bundler reads the `Gemfile` before Rails loads dotenv.

2. Copy the environment template.

   ```bash
   cp .env.example .env
   ```

   Fill the values you need. For a basic local boot, pay attention to:

   - `RAILS_MASTER_KEY`: required if `config/master.key` is not present locally.
   - `DB_HOST`: defaults to `localhost` in `config/database.yml`.
   - `FIREBASE_PROJECT_ID`: required by the Firebase initializer; leave it blank only if Firebase sign-in is not being used.
   - `KEKA_API_KEY_ENCRYPTION_KEY`: required before saving Keka credentials.

3. Make sure PostgreSQL is running.

   Local development currently uses these legacy database names:

   - `pdf_master_development`
   - `pdf_master_test`

   The default local database user/password in `config/database.yml` is `postgres` / `postgres`. Update the file or your local PostgreSQL role if your machine uses different credentials.

4. Install dependencies and prepare the database.

   ```bash
   bin/setup
   ```

   `bin/setup` installs Ruby gems, installs JavaScript packages, runs `bin/rails db:prepare`, clears logs/temp files, and restarts the Rails server.

5. Seed starter data if needed.

   ```bash
   bin/rails db:seed
   ```

   Seeds create baseline roles, teams, projects, work categories, work priorities, work tags, departments, and starter issue-tracker data.

6. Start the app.

   ```bash
   bin/dev
   ```

   `bin/dev` starts Rails, the JavaScript build watcher, and the Vite dev server via `Procfile.dev`.

   Open:

   ```text
   http://localhost:3000
   ```

   To run Rails on another port:

   ```bash
   PORT=3001 bin/dev
   ```

## Environment Variables

Environment variables are documented in `.env.example`. The most important groups are:

- App/runtime: `RAILS_MASTER_KEY`, `RAILS_LOG_LEVEL`, `RAILS_MAX_THREADS`, `RAILS_MIN_THREADS`, `WEB_CONCURRENCY`
- Database: `DB_HOST`, `DATABASE_URL`
- Mail links and SMTP: `BASE_URL`, `FRONTEND_URL`, `SMTP_ADDRESS`, `SMTP_PORT`, `SMTP_DOMAIN`, `SMTP_USERNAME`, `SMTP_PASSWORD`
- CORS: `CORS_ALLOWED_ORIGINS`, `CORS_ALLOWED_PATH`
- Action Cable: `REDIS_URL`
- Rate limits: `RACK_ATTACK_LOGIN_PER_MINUTE`, `RACK_ATTACK_REQUESTS_PER_MINUTE`, `RACK_ATTACK_SIGNUP_PER_HOUR`
- Contact form reCAPTCHA: `VITE_RECAPTCHA_SITE_KEY`, `RECAPTCHA_SECRET_KEY`, `RECAPTCHA_MIN_SCORE`
- Knowledge cards and feeds: `VITE_GNEWS_API_KEY`, `VITE_NEWSAPI_KEY`, `VITE_FINANCIAL_MODELING_PREP_API_KEY`, `VITE_ALPHA_VANTAGE_API_KEY`, `VITE_NEWSDATA_API_KEY`, `VITE_GUARDIAN_API_KEY`, `VITE_WORDNIK_API_KEY`, `VITE_NASA_API_KEY`
- Firebase: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`, `VITE_FIREBASE_MEASUREMENT_ID`
- Keka: `KEKA_API_KEY_ENCRYPTION_KEY`
- Slack notifications: `SLACK_WEBHOOK_URL`

Values prefixed with `VITE_` are exposed to browser-side JavaScript. Do not put private server secrets in `VITE_` variables.

## Google Sheets Integration

Google Sheets features are optional and are used for sprint task sheets, sprint log export, and issue imports.

To enable them:

1. Create a Google service account.
2. Download its JSON key.
3. Save it as:

   ```text
   config/google_service_account.json
   ```

4. Share each target spreadsheet with the service account email.
5. Add the spreadsheet IDs in the project settings screen.

`config/google_service_account.json` is intentionally ignored by Git.

## Useful Commands

```bash
bin/setup                         # install dependencies and prepare DB
bin/dev                           # run Rails, JS watcher, and Vite
bin/rails db:prepare              # create/migrate database
bin/rails db:seed                 # seed starter data
bin/rails routes                  # inspect Rails routes
yarn test                         # run Vitest utility tests
RAILS_ENV=production bin/vite build
bin/rails assets:precompile
```

## Tests

The repository currently has Vitest tests for selected JavaScript utilities:

```bash
yarn test
```

There is no committed Rails test suite yet.

## Docker

`Dockerfile` and `docker-compose.yml` are present, but local development is currently better served by `bin/dev`.

The current container setup has a few requirements to handle first:

- The compose file uses version `3.8`; use the modern `docker compose` plugin or a Compose version that supports it.
- The app depends on the local `PdfMaster` gem path during bundle resolution. A clean container build needs that gem made available inside the image build, vendored into the repo, or published as a normal gem dependency.
- The compose setup runs Rails in production mode, so `.env` needs production-ready values.
- Full PDF image-export support also needs Poppler/ImageMagick tools available in the runtime image.

At minimum, production-style Docker runs need:

```env
RAILS_MASTER_KEY=...
DATABASE_URL=postgresql://postgres:postgres@db:5432/nexus_hub_production
```

After the dependency and runtime requirements above are handled, run:

```bash
docker compose up -d db
docker compose build web
docker compose run --rm web bin/rails db:prepare
docker compose up web
```

Open `http://localhost:3000`.

## Project Structure

- `app/javascript` - React app, pages, components, API client helpers, styles, and utility tests.
- `app/controllers` - Rails page controller, PDF controllers, and API controllers.
- `app/models` - Users, roles, projects, teams, tasks, logs, issues, calendar events, conversations, and integration models.
- `app/services` - Google Sheets, Keka, JWT, issue import, news, and other integration services.
- `app/jobs` - reminder and notification jobs.
- `db/migrate` - database schema changes.
- `db/seeds.rb` - starter workspace data.
- `docs` - feature notes and technical documentation.

## Troubleshooting

- `Could not find gem 'PdfMaster'`: export `PDF_MASTER_PATH` to the local `PdfMaster` gem directory and run `bundle install` again.
- PostgreSQL authentication errors: align `config/database.yml` with your local PostgreSQL username/password or create the expected `postgres` role with password `postgres`.
- PDF image export fails with `pdftoppm`: install Poppler utilities.
- Image processing fails in PDF flows: install ImageMagick and confirm `convert` or `magick` is available.
- Google Sheets errors: confirm `config/google_service_account.json` exists, the spreadsheet is shared with the service account, and the project has the correct sheet ID.
- Firebase token errors: verify both browser `VITE_FIREBASE_*` values and server-side `FIREBASE_PROJECT_ID`.
