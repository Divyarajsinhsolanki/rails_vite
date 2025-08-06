# Rails + Vite Sample Application

This application showcases how to build a modern React front end on top of a Ruby on Rails API using the [vite-plugin-ruby](https://github.com/vite-ruby/vite_ruby). It includes PDF editing endpoints, JWT based authentication via Devise and a small example of reading data from Google Sheets.

## Requirements

- Ruby 3.3.0
- Node 20.18.0
- Yarn 1.22
- PostgreSQL

## Setup

1. Install gems and JavaScript packages:

   ```bash
   bin/setup
   ```

2. Configure environment variables:

   ```bash
   cp .env.example .env
   # edit .env
   ```

3. Create the database, run migrations and load the seed data:

   ```bash
   bin/rails db:create db:migrate db:seed
   ```

4. Start the application:

   ```bash
   bin/dev
   ```

The Rails server and Vite development server will run together.

## Purpose

The project serves as a learning playground and starting point for applications that need a Rails backend and a React front end bundled through Vite. It demonstrates PDF manipulation, token based authentication and external API integrations.

## Tests

This repository does not include an automated test suite.

## Deployment

For production builds:

```bash
RAILS_ENV=production bin/vite build
bin/rails assets:precompile
```

A `Dockerfile` and `docker-compose.yml` are provided for containerized environments.
