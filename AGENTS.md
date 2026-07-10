# Persist Fitness Agent Instructions

Persist Fitness is a real startup-quality fitness tracking app, not a throwaway portfolio project.

## Product goal

Build Persist Fitness into a polished, mobile-first workout tracking product that can become App Store-ready. The target feel is a premium mobile app: smooth, reliable, motivating, and simple. It should move closer to Duolingo-level polish without copying Duolingo directly. 

Think:
- Duolingo-level polish
- WHOOP-style seriousness
- Strong workout-tracker utility
- Mobile-first app experience
- Not a web dashboard squeezed onto a phone

Long-term goals:
- TestFlight beta
- App Store-ready MVP
- Monetization before end of year
- Future premium AI coaching, weekly reports, plateau detection, and progression suggestions

## Stack

The app lives under `frontend/`.

Stack:
- Next.js 16
- React 19
- TypeScript
- Tailwind v4
- NextAuth v5 beta
- Prisma
- Supabase/Postgres
- Zod
- Sonner
- Vitest
- Testing Library
- Vercel

## Development rules

Do not push to GitHub unless explicitly asked.

Prefer small, focused changes.
Prefer one feature or cleanup per task.
Do not rewrite unrelated files.
Do not introduce large dependencies without asking first.
Do not remove existing functionality without explaining why.
Do not change database schema unless the task explicitly requires it.
Do not touch `.env` files or secrets.
Do not paste or expose secrets.

Always inspect current code before editing.

After edits, run:

```bash
cd frontend
npm run lint
npm run test
npm run build

If any check fails, fix it before considering the task done.

Git workflow

Before editing:

Check git status
Avoid mixing unrelated changes

After editing:

Show a concise diff summary
Do not commit unless asked
Do not push unless asked
UI direction

The app should feel mobile-first, not like a desktop dashboard squeezed onto a phone.

Design principles:

Today-first home screen
One obvious next action
Minimal first-screen scrolling
Strong bottom navigation
Clear progress loops
Streaks and weekly momentum
Smooth feedback after actions
Compact mobile cards
Analytics moved into deeper Progress views
Premium shown tastefully, not aggressively

Avoid:

Long dashboard walls
Too many cards on the home screen
Desktop-first layouts
Generic SaaS UI
Overstuffed hero sections
Raw browser alerts
Security rules

All protected pages must require a signed-in user.
All user-owned data queries must be scoped by userId.
All server actions that mutate workout data must verify ownership.
Never trust client-provided IDs without server-side ownership checks.
Keep auth and ownership helpers centralized where possible.

Quality gate

Every task should pass:

npm run lint
npm run test
npm run build

For UI tasks, manually test:

mobile viewport
desktop viewport
signed-in state
signed-out redirect if protected
empty state if applicable

Save the file with:

```text
Ctrl + S