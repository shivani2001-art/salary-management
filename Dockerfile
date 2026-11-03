# syntax=docker/dockerfile:1
# Single image: Vite builds the React app, Rails serves it from public/ alongside /api.

FROM node:24-slim AS web
WORKDIR /web
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM ruby:3.3.10-slim AS gems
RUN apt-get update -qq && apt-get install --no-install-recommends -y build-essential libyaml-dev && rm -rf /var/lib/apt/lists/*
ENV BUNDLE_DEPLOYMENT=1 BUNDLE_WITHOUT="development:test" BUNDLE_PATH=/usr/local/bundle
WORKDIR /rails
COPY backend/Gemfile backend/Gemfile.lock ./
RUN bundle install && rm -rf "${BUNDLE_PATH}"/ruby/*/cache

FROM ruby:3.3.10-slim
RUN apt-get update -qq && apt-get install --no-install-recommends -y sqlite3 libyaml-0-2 && rm -rf /var/lib/apt/lists/*
ENV RAILS_ENV=production BUNDLE_DEPLOYMENT=1 BUNDLE_WITHOUT="development:test" BUNDLE_PATH=/usr/local/bundle \
    RAILS_LOG_TO_STDOUT=1 PORT=3000
WORKDIR /rails
COPY --from=gems /usr/local/bundle /usr/local/bundle
COPY backend/ ./
COPY --from=web /web/dist/ ./public/
RUN bundle exec bootsnap precompile app/ lib/ && \
    useradd rails --create-home --shell /bin/bash && \
    mkdir -p storage tmp log && chown -R rails:rails storage tmp log
USER rails
EXPOSE 3000
ENTRYPOINT ["/rails/bin/docker-entrypoint"]
CMD ["./bin/rails", "server", "-b", "0.0.0.0"]
