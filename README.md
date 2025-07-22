# Rails + Vite Sample Application

This project demonstrates how to combine **Ruby on Rails** with **React** using [vite-plugin-ruby](https://github.com/vite-ruby/vite_ruby). It includes PDF editing endpoints, JWT based authentication via Devise, and a small event booking feature powered by Stripe.

## Requirements

- **Ruby** `3.3.0`
- **Node** `20.18.0`
- **Yarn** `1.22`
- **PostgreSQL**

Ensure these versions are available on your machine or use the provided `Dockerfile`.

## Setup

1. Install gems and JavaScript packages:

   ```bash
   bin/setup
   ```

   This script runs `bundle install`, `yarn install`, prepares the database and clears logs.

2. Copy `.env.example` to `.env` and fill in your SMTP credentials:

   ```bash
   cp .env.example .env
   # edit .env with your mail server details
   ```

3. Create and migrate the database:

   ```bash
   bin/rails db:create db:migrate
   ```

4. Start the application in development:

   ```bash
   bin/dev
   ```

   This runs `bin/rails` and the Vite dev server together via `Procfile.dev`.

## Features

- **PDF manipulation** – endpoints allow uploading a PDF, adding pages or text, rotating, merging and more. See `PdfsController` and `PdfModifiersController` for details.
- **Authentication** – JWT based login, signup and refresh handled in `Api::AuthController`.
- **Event booking** – `Api::EventsController` uses Stripe Checkout and `Api::TicketsController` generates a QR code ticket.

## Example Endpoints

```ruby
# Add text to a PDF
# ...app/controllers/pdf_modifiers_controller.rb
```

The PDF controller exposes actions like `add_text`, `add_page`, `remove_page`, and others.

```ruby
# User signup/login
# ...app/controllers/api/auth_controller.rb
```

Authentication actions provide JWT cookies for the API.

## Running tests

This project does not include an automated test suite.

## Deployment

For production builds, precompile assets with Vite and run Rails:

```bash
RAILS_ENV=production bin/vite build
bin/rails assets:precompile
```

You can also build the Docker image using the provided `Dockerfile`.

### Running with Docker Compose

To run the app and a PostgreSQL database locally, use the included
`docker-compose.yml`:

```bash
docker compose build
docker compose up
```

The web service loads environment variables from `.env`. The database service
stores its data in the `db-data` volume.

## Google Sheets Integration

The app includes a small example page that reads data from a Google Sheet using
a service account. To configure it:

1. Add the service account JSON key to `config/google_service_account.json` (the
   file is ignored by Git).
2. Edit `SPREADSHEET_ID` in `app/services/google_sheets_reader.rb` to match your
   sheet ID.
3. Visit `/sheet` in your browser to see the raw rows rendered in a table. Pass
   `?sheet=TabName` to view a specific tab.

