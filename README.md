<p align="center">
  <img src="src/assets/logos/logo-light.svg" alt="Quizmosa" width="280" />
</p>

<p align="center"><strong>Live quizzes. Spill the answers.</strong></p>

Quizmosa runs live quizzes in a room. Many people answer from their phones at the same time, each question has a server-enforced countdown, rankings update live, and a big-screen view shows the leaderboard on a projector.

The name comes from the Filipino word _chismosa_ (gossiper).

## Features

**For admins** (email and password)

- Build questionnaires of kind standard, pre-test or post-test, with images, 2 to 4 choices, points, per-question time limits and drag-to-reorder
- Import questions from JSON, with a per-row preview and a downloadable sample
- Host a live quiz with a join code and QR, and control it: start, next question, reveal, finish, kick
- Show a live leaderboard and a fullscreen big-screen mode for a projector
- Review history with charts, per-host reports and a participant list

**For quizzers** (no account)

- Join with a 6-character code or QR, using Supabase anonymous sign-in
- Answer on a mobile-first screen with a countdown, reveal and final rank
- Pre-tests are self-paced: each quizzer taps Next on their own timer, and they never show the correct answer, so they don't spoil the post-test

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
