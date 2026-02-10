# Rails + Vite Sample Application

This application showcases how to build a modern React front end on top of a Ruby on Rails API using the [vite-plugin-ruby](https://github.com/vite-ruby/vite_ruby). It includes PDF editing endpoints, JWT based authentication via Devise and a small example of reading data from Google Sheets.

## Features

- Rails 7 API application with React components compiled by Vite.
- Hot reloading for front-end code while developing.
- JWT-based authentication handled through Devise and `devise-jwt`.
- Example PDF editing endpoints powered by `CombinePDF`.
- Integration with the Google Sheets API.
- Docker configuration for containerized development and deployment.

## Requirements

- Ruby 3.3.0
- Node 20.18.0
- Yarn 1.22
- PostgreSQL

## Setup

1. **Install dependencies**

   Runs `bundle install` and `yarn install` in one step.

   ```bash
   bin/setup
   ```

   The script installs Ruby/JS dependencies, prepares the database, clears logs/tempfiles, and restarts the Rails server.

2. **Configure environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your database credentials, JWT secret and any Google API tokens required by the services in `app/services`.

3. **Prepare the database**

   ```bash
   bin/rails db:create db:migrate db:seed
   ```

   The seeds populate baseline data such as roles, teams, projects, work categories/tags, departments, and sample issues.

4. **Start the application**

   ```bash
   bin/dev
   ```

   This starts the Rails API and the Vite development server together.

5. **Run with Docker** (optional)

   ```bash
   docker-compose up --build
   ```

## Required Environment Variables

The following values are referenced by the application or infrastructure configuration:

- `RAILS_MASTER_KEY` (required): decrypts Rails credentials.
- `DB_HOST` or `DATABASE_URL` (required): database connectivity.
- `SMTP_ADDRESS`, `SMTP_PORT`, `SMTP_DOMAIN`, `SMTP_USERNAME`, `SMTP_PASSWORD` (optional): outbound email delivery.
- `BASE_URL` (optional): base URL for mailer links.
- `REDIS_URL` (optional): Action Cable Redis connection.
- `SLACK_WEBHOOK_URL` (optional): issue notification hooks.

For Google Sheets integration, provide `config/google_service_account.json` with a service account key and share the target spreadsheet with that account.

## Docker Quickstart

```bash
cp .env.example .env
docker-compose up --build
docker-compose run --rm web bin/rails db:prepare
```

Visit `http://localhost:3000` once the containers are running.

## API Overview

Authentication is cookie-based: `/api/signup` and `/api/login` set a signed `access_token` cookie used by authenticated endpoints.

Key endpoints:

- `POST /api/signup`, `POST /api/login`, `DELETE /api/logout`, `POST /api/refresh`
- `POST /upload_pdf`, `POST /api/update_pdf`, `GET /download_pdf`
- `GET /api/sheet` (Google Sheets data)
- RESTful resources under `/api` (e.g., `/api/tasks`, `/api/projects`, `/api/work_logs`)

## Purpose

The project serves as a learning playground and starting point for applications that need a Rails backend and a React front end bundled through Vite. It demonstrates PDF manipulation, token based authentication and external API integrations.

## Project Structure

- `app/javascript` – React application compiled by Vite.
- `app/controllers` – API endpoints consumed by the front end.
- `app/services` – integration helpers such as Google Sheets readers and JWT helpers.
- `docs/calendar_reminder_plan.md` – proposed roadmap for calendar, reminder, and meeting scheduling features.

## Tests

No Rails RSpec test suite is configured in this project.

## Deployment

For production builds:

```bash
RAILS_ENV=production bin/vite build
bin/rails assets:precompile
```

A `Dockerfile` and `docker-compose.yml` are provided for containerized environments.
