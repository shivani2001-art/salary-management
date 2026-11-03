# How AI was used

Built with **Claude Code** (agentic coding in the terminal) as a pair programmer. I owned the product
scope and design decisions; the agent did most of the typing, and every step was verified by running it.

## Workflow

1. **Requirements first.** The assessment PDF was given to the agent, and the one-page requirements doc
   (`docs/REQUIREMENTS.md`) was written and committed *before any code*, including what to leave out.
2. **Backend inside-out, test-backed.** Model → query object → stats service → controllers → seeder. Each layer
   was committed with its specs green before moving on (see `git log`).
3. **Frontend against the real API.** The UI was driven in a real browser against the seeded 10k-row
   database: filtering, sorting, editing a salary, and triggering a duplicate-email validation error.
4. **Production check.** The Vite build was served by Rails in `RAILS_ENV=production` through the Docker
   entrypoint; endpoint latencies were measured on 10k rows.

5. **Design pass.** Design context (audience, personality, palette) was written down first (`.impeccable.md`),
   then the UI was redesigned against it. The two pages were built by **two parallel subagents** with disjoint
   file ownership (Insights / People); the shared foundation (tokens, theme, motion helpers) was written first
   so neither had to touch it.
6. **Deploy and showcase.** The Docker image runs on Vercel's container runtime; README images (animated
   banner, screenshots, demo GIF) are rendered by a script (`docs/assets/src/capture.mjs`) so they can be
   regenerated, not hand-made.

## Representative prompts

- "Create a project folder and finish the things asked in the PDF" (the kickoff; the agent read the PDF and
  proposed the stack based on my earlier Rails work).
- "Write a one-page requirements doc: goal, scope & features, what we deliberately leave out and why."
- "Compute per-group medians without one query per group." → SQLite window-function query in `SalaryStats`.
- "Make the seed deterministic and realistic: weighted country mix, country pay multipliers, ±20% spread."

## Where AI output was corrected or tightened (by review and by tests)

- **Unpermitted params reaching `where`**: the first controller passed raw `params` to the query object;
  tightened to `permit` scalars only, with a request spec proving `country[evil]=1` is ignored.
- **Cache headers**: the Rails default (`max-age=1 year` on all of `public/`) would have pinned `index.html`
  across deploys; changed to `no-cache` (revalidate).
- **Redundant seed step** in the Docker entrypoint (`db:prepare` already seeds a fresh DB); removed after
  reading the boot log.
- **Accessibility**: a test caught the bar's `aria-valuenow` being `33.333…`; now rounded.
- **Mobile layout**: header subtitle overflowed the app bar at phone width (seen in a screenshot); hidden below `sm`.
- **Blurry edit panel**: the first side panel "morphed" out of its trigger with a View Transition, which scales a
  bitmap snapshot and looked soft; replaced with a transform/opacity animation on the live element.
- **Weak filter separation**: hairline dividers between filters read as one block in dark mode; reworked twice
  (tiles, then separate floating pills) after looking at the user's screenshot.
- **Capture script edited the wrong row**: restoring a demo edit "by position" hit a different employee after a
  tab switch reset the sort. Fixed the data, and the script now restores by id in a `finally`.
- **Animated banner size**: the first animated WebP was ~7 MB because full-frame motion defeated inter-frame
  compression; keeping motion to small regions brought it to ~160 KB.
- **Ignored tool suggestions**: an editor hook suggested Next.js-specific changes on a Ruby file; not applicable.

## Guardrails I kept

- Tests are fast and deterministic (no network, fixed RNG seed, fixed reference date in the seeder).
- No dependency added for something a few lines could do (no pagination gem, no chart library, no data-fetching
  library; a 25-line `useApi` hook covers it).
- Every allow-list (`group_by`, `sort`) has a test that a bad value is rejected.
