# syntax = docker/dockerfile:1

ARG RUBY_VERSION=3.3.0
FROM registry.docker.com/library/ruby:$RUBY_VERSION-slim as base

WORKDIR /rails

ENV RAILS_ENV="production" \
    BUNDLE_DEPLOYMENT="1" \
    BUNDLE_PATH="/usr/local/bundle" \
    BUNDLE_WITHOUT="development test"

# --- Build Stage ---
FROM base as build

RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y \
      build-essential \
      curl \
      git \
      libpq-dev \
      libvips \
      node-gyp \
      pkg-config \
      python-is-python3

ARG NODE_VERSION=20.18.0
ARG YARN_VERSION=1.22.22
ENV PATH=/usr/local/node/bin:$PATH
RUN curl -sL https://github.com/nodenv/node-build/archive/master.tar.gz | tar xz -C /tmp/ && \
    /tmp/node-build-master/bin/node-build "${NODE_VERSION}" /usr/local/node && \
    npm install -g yarn@$YARN_VERSION && \
    rm -rf /tmp/node-build-master

COPY Gemfile Gemfile.lock ./
RUN bundle install && \
    rm -rf ~/.bundle/ "${BUNDLE_PATH}"/ruby/*/cache "${BUNDLE_PATH}"/ruby/*/bundler/gems/*/.git && \
    bundle exec bootsnap precompile --gemfile

COPY package.json yarn.lock tailwind.config.js postcss.config.js ./
RUN yarn install --frozen-lockfile

COPY . .

RUN bundle exec bootsnap precompile app/ lib/
RUN RAILS_ENV=production bin/vite build

# Set ENV needed only for build phase
ENV SMTP_ADDRESS="smtp.example.com"
ENV SMTP_PORT="587"
ENV SMTP_USERNAME="dummy@example.com"
ENV SMTP_PASSWORD="dummy"
ENV SECRET_KEY_BASE="dummy_secret_key_base_for_build"

RUN RAILS_ENV=production bundle exec rails assets:precompile

# --- Final Runtime Stage ---
FROM base

RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y \
      libpq5 \
      libsqlite3-0 \
      libvips && \
    rm -rf /var/lib/apt/lists/* /var/cache/apt/archives/*

COPY --from=build /usr/local/bundle /usr/local/bundle
COPY --from=build /rails /rails

# Ensure all required directories exist before chown
RUN mkdir -p db log storage tmp public/vite-production && \
    useradd rails --create-home --shell /bin/bash && \
    chown -R rails:rails db log storage tmp public/vite-production

USER rails:rails

ENTRYPOINT ["/rails/bin/docker-entrypoint"]

EXPOSE 3000
CMD ["./bin/rails", "server"]
