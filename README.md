# QuantGym

A personal quant practice site: mental math, probability, worked explanations, session history, and Supabase progress syncing. Built with HTML, CSS, and JavaScript for GitHub Pages.

## Run locally

Use Node.js 20 or later. No package installation required.

```sh
npm test
npm run dev
```

Open http://127.0.0.1:4173. Sign-in requires internet access for Supabase and its pinned client library. Fonts fall back to system fonts if unavailable.

## Publish

In this repository, open Settings → Pages. Choose Deploy from a branch, then main and / (root), and Save. The expected address is https://andrewf124.github.io/quantgym/ once GitHub finishes deployment.

## Personal account

The project URL, publishable API key, and allowed owner UUID are configured in app.js. These are public client configuration. Never add a database password or a secret/service_role key. Data access must be enforced by the existing training_results table's RLS policy, not only by the interface's owner check.

The table uses id, user_id, completed_at, activity, and results (JSONB). Authenticated requests need SELECT, INSERT, UPDATE, DELETE grants, with RLS limiting every operation to the owner UUID and matching user_id. This was configured separately in Supabase.

Sign in with your Supabase email/password user. A completed session is assigned a UUID and saved locally pending successful upsert; retries use that same UUID. Completed signed-out rounds are saved in this browser. After signing in, use Save browser runs to my account to sync them. Results refresh on sign-in, browser focus, reconnect, or Refresh. Completed timed rounds and ten-question probability sessions are stored. Each run is stored under its own browser key so separate tabs do not overwrite the full history.

## Verify the connection

1. Sign in as the owner, complete a session, and check for Synced status.
2. Sign in on another device and confirm that result appears.
3. Sign out; private history should disappear.
4. In Supabase, verify anonymous and other authenticated users cannot read or change training_results. Database administrators retain administrative access.

The automated tests cover answer parsing, rounding, question generation, and statistics. Live owner authentication and cross-device syncing require the owner's credentials and must be checked separately.

## Timed mental math

Mental math now uses a speed drill: choose operations, operand ranges, and 30/60/120/300 seconds (default 120). Correct integer answers advance as you type; incorrect input stays editable. Subtraction and division reverse the configured addition and multiplication ranges. The timer continues in background tabs; only answers received before the deadline count. Discarded rounds are not saved. Completed rounds store the score, duration, settings, and answered questions in the existing results JSONB field; no database migration is needed. Graded accuracy excludes speed rounds because these only record correct answers. Probability retains its ten-question practice format.


## Saved run history

Completed runs are retained locally, including successful cloud saves, so history survives refreshes and temporary network failures. Signed-in history is kept separately from guest history and hidden when signed out. Browser storage is device-specific and clearing site data removes the local copies; cloud-synced records remain in Supabase. Legacy unsynced queues migrate without deleting their records until the migration succeeds.

The history defaults to timed math, with an All practice filter, expandable question breakdowns, answer timings, configured ranges, score, duration, and JSON export of every run matching the filter. Show older runs to go beyond the first ten. Existing cloud runs are shown using their stored data; unsaved runs from earlier versions cannot be reconstructed. Discarded and unfinished rounds are not saved. No Supabase migration is required.
