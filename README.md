# OBM Daybook

What I owe which customer today, and who's slipping.

Transitioning from Technical Onboarding to Onboarding was rough. Here's the tool I wish I'd had.

An Onboarding Manager (OBM) guides many new customers through their first weeks at once. Each account moves through 
a chain of touchpoints (welcome, reminders, kickoff call, plan, tools walkthrough, support handoff), and most 
deadlines are counted from the step before. One late reply pushes everything after it. Tracked by hand in a 
spreadsheet (or worse yet, not tracked at all in my case), that's easy to miss. This app's goal is to answer one 
question each morning: **what do I owe which customer today, and who is slipping?**

## Status

Slice 1, in progress. Data is in memory and resets when the server restarts. All sample accounts are invented.

- [x] Accounts API: list, get one, create with validation
- [ ] Schedule: due dates, overdue counts, and health (green / yellow / red) calculated from the dates things happened
- [ ] "Due today" page, most overdue first
- [ ] Support ticket counts from a ticket source (a fake now, Zendesk later)

## How it's built

- **Next.js (App Router) + TypeScript + Tailwind**
- **Spec first.** Before any code, the feature was written up as a spec with numbered requirements (R1 to R22), decisions, and open questions, then reviewed by a fresh-context AI reviewer until it passed. Commits cite the requirement they implement. Spec: [`specs/acc-01-account-timeline/spec.md`](specs/acc-01-account-timeline/spec.md).
- The spec workflow uses [Rob Ruiz's spec skills](https://github.com/robruiz/rob-ruiz-skills) (MIT), adapted for Claude Code in `.claude/skills/`.
- **Store facts, derive status.** An account stores only the dates things happened. Due dates and health are calculated each time, so nothing stored can go stale.

## API

| Method | Path | Result |
|---|---|---|
| GET | `/api/accounts` | 200, all accounts |
| GET | `/api/accounts/{id}` | 200, or 404 if not found |
| POST | `/api/accounts` | 201 with the stored account, or 400 naming the bad field |

## Run it

```bash
npm install
npm run dev
```

Then, in another terminal:

```bash
curl localhost:3000/api/accounts

curl -i -X POST localhost:3000/api/accounts \
  -H "Content-Type: application/json" \
  -d '{"accountName":"Lakeside Pottery","planSize":"Small","customerType":"new_business","startDate":"2026-11-20","owner":{"name":"Pat Lee","email":"pat@example.com"}}'
```
