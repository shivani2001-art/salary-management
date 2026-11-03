# ACME Salary Management

Web app for an HR Manager to manage salary records for ~10,000 employees across countries and answer
"how do we pay people?" questions: min / median / max / average pay by country, department and job title
(e.g. *what does a Software Engineer in India earn?*).

**Stack:** Rails 8.1 (API) · SQLite · React 19 + TypeScript + Mantine (Vite) · RSpec · Vitest

| Doc | What's in it |
|---|---|
| [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md) | One-page requirements: goal, scope, what's deliberately left out and why |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Diagram, API, design decisions & trade-offs, performance notes, next steps |
| [docs/AI_USAGE.md](docs/AI_USAGE.md) | How AI tools were used, prompts, and what was corrected |

## Features

- **Employees:** search (name/email/title), filter by country/department/job title, sort, paginate; add, edit,
  delete with validation (client-side and server-side, server errors shown on the field).
- **Insights:** headcount, total payroll, average & median salary; breakdown by country, department or job title,
  optionally within one country.
- **Seed:** deterministic 10,000 employees across 10 countries, 7 departments, 17 job titles.

## Run locally

Prereqs: Ruby 3.3.10, Node 24, SQLite.

```bash
cd backend && bundle install && bin/rails db:prepare   # creates DB and seeds 10k employees
```

```bash
cd backend && bin/rails server                          # API on :3000
```

```bash
cd frontend && npm install && npm run dev               # UI on http://localhost:5173 (proxies /api to :3000)
```

Reseed from scratch: `cd backend && bin/rails db:seed:replant`. Set `SEED_COUNT` to change the size.

## Tests

```bash
cd backend && bundle exec rspec        # 51 examples: model, query, stats, seeder, request specs (~1s)
```

```bash
cd frontend && npm test                # 19 tests: API client, formatting, form, breakdown table (~1s)
```

Lint: `cd backend && bin/rubocop` · `cd frontend && npm run lint && npx tsc -b`

## Deploy

One Docker image: Vite builds the UI, Rails serves it from `public/` next to `/api`. On first boot,
`db:prepare` creates the database and seeds 10k employees.

```bash
docker build -t acme-salary .
```

```bash
docker run -p 3000:3000 -e FORCE_SSL=false acme-salary   # http://localhost:3000
```

On a host with TLS in front (Render, Fly, Railway…), leave `FORCE_SSL` unset. `render.yaml` is a ready
Render Blueprint (New → Blueprint → pick this repo). Mount a volume at `/rails/storage` to keep edits across
restarts; without one the demo DB is re-seeded on each restart.

- **Live demo:** _add URL after deploying_
- **Video demo:** _add link_
