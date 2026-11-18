<p align="center">
  <img src="src/assets/logos/logo-light.svg" alt="Quizmosa" width="280" />
</p>

<p align="center"><strong>Live quizzes. Spill the answers.</strong></p>

Quizmosa runs live quizzes in a room. Many people answer from their phones at the same time, each question has a server-enforced countdown, rankings update live, and a big-screen view shows the leaderboard on a projector.

The name comes from the Filipino word _chismosa_ (gossiper).

## Features

**For admins** (email and password)

- Build reusable questionnaires with images, 2 to 4 choices, points and per-question time limits. Reorder questions by dragging, shuffle them, or reset the order
- Import questions from JSON, with a per-row preview and a downloadable sample
- Create a host from any questionnaire and choose its kind: a self-paced pre-test or a host-driven post-test. The same questionnaire can run as both, so the two can be compared
- Run a host with a join code and QR: start, next question, reveal, finish and kick
- Show a live leaderboard, plus a fullscreen big-screen view for a projector
- See history with a pre-test vs post-test average score chart per questionnaire and participants per host
- Open a host report: score, accuracy and response-time charts, and a sortable question table with each question's choices and correct answer
- Open a questionnaire comparison: every participant's pre-test, post-test, total and gap, with top-3 podiums for the **Best Quizmosa Award** (highest total) and the **Kalamboan Award** (biggest raw point gain)
- Export the host report and the comparison as a PDF (light theme, charts full width) through the browser's print dialog
- Browse every participant across hosts. Score sorts break ties by the faster correct-answer time, as on the leaderboard

**For quizzers** (no account)

- Join with a 6-character code or QR, using Supabase anonymous sign-in, and enter a full name and optional alias once per browser
- Answer on a mobile-first screen with a countdown, reveal and final rank
- Pre-tests are self-paced: each quizzer moves on with their own timer, and the correct answer is never shown, so the post-test isn't spoiled

### Pre-test and post-test matching

The comparison uses each person's latest attempt of each kind, from finished hosts only, without kicked participants. A person is recognized by their anonymous sign-in, so quizzers should use the same device and browser for both tests. If they don't, a pre-test and a post-test are still paired when the full name and alias match (ignoring case and extra spaces) and that name is unique on both sides. Those rows are marked "Matched by name".

## Tech stack

Vue 3, TypeScript, Vite, Vuetify 4, Pinia, TanStack Query, Supabase (Auth, Postgres, RPC, Realtime, Storage), ApexCharts and Three.js.

## Getting started

You need Node `^22.18.0` or `>=24.12.0`, and a Supabase project.

1. Install dependencies:

   ```sh
   npm install
   ```

2. Create a `.env` file in the repo root:

   ```sh
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
   ```

3. Set up the database. See [Database setup](#database-setup).

4. Start the dev server:

   ```sh
   npm run dev
   ```

## Database setup

Run these in the Supabase SQL Editor, in this order:

1. `docs/quizmosa-db.sql` (the baseline schema)
2. `supabase/migrations/20261107000001_rls_fixes.sql`
3. `supabase/migrations/20261107000002_session_rpcs.sql`
4. `supabase/migrations/20261107000003_storage_questions.sql`
5. `supabase/migrations/20261107000004_participants_full_name.sql`
6. `supabase/migrations/20261111000005_self_paced_pretest.sql`
7. `supabase/migrations/20261118000006_history_questionnaire_id.sql`
8. `supabase/migrations/20261118000007_session_kind.sql` (moves kind from the questionnaire to the host and removes Standard)
9. `supabase/migrations/20261118000008_participants_correct_ms.sql`
10. `supabase/migrations/20261118000009_questionnaire_comparison.sql`

Create a storage bucket named `questions` before you run step 4. The migration makes it private, so images are served through signed URLs.

Then, in the Supabase dashboard:

- Turn on anonymous sign-ins. Keep "Allow new users to sign up" on, because turning it off also blocks anonymous sign-ins.
- Raise the anonymous sign-in rate limit. Everyone in a room shares one IP address on the same Wi-Fi, so the default limit is too low for a live event.

### Add an admin

The app has no admin sign-up, and clients cannot insert into `hosts`. Create the user under Authentication in the Supabase dashboard, then run:

```sql
insert into public.hosts (user_id, host_name)
select id, 'Admin' from auth.users where email = 'admin@example.com';
```

## Deployment

The app is a static single-page app. `vercel.json` rewrites every path to `index.html`, so deep links such as `/join/ABC234` work on Vercel. Set the same two `VITE_` variables in the hosting environment.

## Commands

| Task                          | Command              |
| ----------------------------- | -------------------- |
| Dev server                    | `npm run dev`        |
| Build (type-check and bundle) | `npm run build`      |
| Preview the build             | `npm run preview`    |
| Type-check only               | `npm run type-check` |
| Lint (oxlint and eslint)      | `npm run lint`       |
| Format                        | `npm run format`     |

## Author

Created by [Jabez Ian Chris D. Penalver](https://jipenalver.github.io/).
