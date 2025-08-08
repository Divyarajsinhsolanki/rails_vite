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

2. **Configure environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your database credentials, JWT secret and any Google API tokens required by the services in `app/services`.

3. **Prepare the database**

   ```bash
   bin/rails db:create db:migrate db:seed
   ```

4. **Start the application**

   ```bash
   bin/dev
   ```

   This starts the Rails API and the Vite development server together.

5. **Run with Docker** (optional)

   ```bash
   docker-compose up --build
   ```

## Purpose

The project serves as a learning playground and starting point for applications that need a Rails backend and a React front end bundled through Vite. It demonstrates PDF manipulation, token based authentication and external API integrations.

## Project Structure

- `app/javascript` – React application compiled by Vite.
- `app/controllers` – API endpoints consumed by the front end.
- `app/services` – integration helpers such as Google Sheets readers and JWT helpers.

## Tests

This repository does not include an automated test suite.

## Deployment

For production builds:

```bash
RAILS_ENV=production bin/vite build
bin/rails assets:precompile
```

A `Dockerfile` and `docker-compose.yml` are provided for containerized environments.
