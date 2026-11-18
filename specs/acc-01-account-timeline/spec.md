# ACC-01 Account schedule and Due today — spec v0.4 (2026-11-18)

> Depth: `md_html` · Triage: `fallback` (suggested `md`; owner chose `md_html` on 2026-11-18 because the spec carries an API contract and a data flow across the ticketing boundary) · Status: `approved` (owner accepted v0.3 on 2026-11-18 with F21-F22 fixed after the cycle's final review round, not re-scored; v0.4 contact change made by the owner without a review round, listed under Review)
> Owner: Tray · Seams: `3`
> v0.4 (2026-11-18): contacts carry name and email (owner replaces ownerName; R4, R5, R12, R15, D15, Q15).
> v0.3 (2026-11-18): owner amendments after SHIP: kickoff no-show and waive (R19-R21), reminders continue past 2 with escalation (R7, R9), 7-day contact check-in (R22).
> v0.2 (2026-11-18): revised after review round 1 (findings F1-F12). Title narrowed from "Account timeline" because the per-account timeline page moved to slice 2 (F8).

## Problem

An Onboarding Manager (OBM: the person who guides a new customer through their first weeks) carries a whole book of accounts at once. Each account moves through a checklist of touchpoints (messages and calls), and every touchpoint has to happen. Most deadlines depend on when the previous step happened, so one late reply or a late kickoff call pushes everything after it. Tracked by hand in a spreadsheet, it is easy to miss a deadline, and a missed one cascades: the OBM catches up, then still has to wait days before the next step. There is no single place that answers "what do I owe which customer today, and who is slipping?"

## Solution

A single-OBM web app. Each account stores only facts: its start date, when its kickoff call was booked and for what date, and the date each touchpoint was completed. The app derives every due date from that chain, and from the due dates it derives a health color and a "Due today" list, so nothing is stored that can go stale. A small REST API over an in-memory store serves the stored accounts; a database replaces the store in a later slice without changing the API. Support tickets are never rebuilt here: the page asks a ticket source for each account's open-ticket count (a fake source now, Zendesk later) and passes the count into the schedule calculation.

## How we prove it

Three seams, all below the UI so tests stay fast and need no browser:

| Seam | What it pins | Kind |
|---|---|---|
| Schedule module `src/lib/schedule.ts`: `computeSchedule(account, today, openTicketCount: number \| null)`, `buildDueToday(accounts, today, ticketCounts: Record<string, number \| null>)`, `healthLabel(health)`, `todayInChicago(now)`; all pure, no I/O; `null` means the ticket count is unavailable | due dates, reminders, health and its text, row order, "today" in the OBM's time zone | test |
| Tickets module `src/lib/tickets.ts`: `fetchTicketCounts(source, ids, timeoutMs)` returns `Record<string, number \| null>` | asking the TicketSource, with a timeout; a throw or timeout becomes `null` | test |
| Accounts route handlers, called directly with a `Request` | status codes and response bodies | test |

Setup before the first test (F10): install `vitest` as a dev dependency, add `vitest.config.ts` with the `@/` path alias matching `tsconfig.json`, and add `"test": "vitest run"` to `package.json` (`npx vitest` for watch mode while coding).

| R-ID | Check | Evidence target |
|---|---|---|
| R1 | test | `src/app/api/accounts/route.test.ts` · "R1 lists accounts" |
| R2 | test | `src/app/api/accounts/[id]/route.test.ts` · "R2 returns one account" |
| R3 | test | `src/app/api/accounts/[id]/route.test.ts` · "R3 unknown id is 404" |
| R4 | test | `src/app/api/accounts/route.test.ts` · "R4 create returns 201 with defaults" |
| R5 | test | `src/app/api/accounts/route.test.ts` · "R5 invalid body is 400" |
| R6 | test | `src/lib/schedule.test.ts` · "R6 due dates follow the chain" |
| R7 | test | `src/lib/schedule.test.ts` · "R7 reminders every 3 days from the latest anchor" |
| R8 | test | `src/lib/schedule.test.ts` · "R8 one row per due touchpoint" |
| R9 | test | `src/lib/schedule.test.ts` · "R9 health colors" |
| R10 | test | `src/lib/schedule.test.ts` · "R10 rows sorted most overdue first" |
| R11 | test | `src/lib/schedule.test.ts` · "R11 handoff holds on open tickets" |
| R12 | test | `src/lib/tickets.test.ts` · "R12 fake source counts open tickets" |
| R13 | test | `src/lib/schedule.test.ts` · "R13 todayInChicago near midnight UTC" |
| R14 | test | `src/lib/schedule.test.ts` · "R14 healthLabel text for every status" (plus the walkthrough screenshot) |
| R15 | review | `src/lib/seed.ts`, read by the owner before each commit that changes it |
| R16 | test | `src/lib/tickets.test.ts` · "R16 throw or timeout gives null"; `src/lib/schedule.test.ts` · "R16 null count shows tickets unavailable" |
| R17 | test | `src/app/api/accounts/route.test.ts` · "R17 non-JSON body is 400" |
| R18 | test | `src/lib/schedule.test.ts` · "R18 empty list" (plus the walkthrough screenshot) |
| R19 | test | `src/lib/schedule.test.ts` · "R19 kickoff call states, including waived" |
| R20 | test | `src/lib/schedule.test.ts` · "R20 no-show starts reschedule outreach" |
| R21 | test | `src/lib/schedule.test.ts` · "R21 waived call moves T4" |
| R22 | test | `src/lib/schedule.test.ts` · "R22 check-in after 7 days without contact" |

## Requirements (when/if/then)

```
R1 [must] — List accounts
  When a client sends GET /api/accounts
  Then the response is 200 with a JSON array of every stored account record
       (stored facts only; no derived schedule or health)

R2 [must] — Get one account
  When a client sends GET /api/accounts/{id}
  If   an account has that id
  Then the response is 200 with that stored account record as JSON

R3 [must] — Unknown account
  When a client sends GET /api/accounts/{id}
  If   no account has that id
  Then the response is 404 with JSON { "error": "Account <id> not found" }

R4 [must] — Create an account
  When a client sends POST /api/accounts with accountName, owner (a contact),
       planSize, customerType, startDate, and optional authorizedContacts (a list
       of contacts), where a contact is { name, email }
  Then the response is 201 with the stored account: a server-generated id,
       every email trimmed and lowercased,
       authorizedContacts defaulting to [], remindersSentOn and checkInsSentOn
       set to [], and every other event field (welcomeSentOn, kickoffBookedOn,
       kickoffCallOn, kickoffOutcome, kickoffWaivedOn, rescheduleOutreachSentOn,
       planSharedOn, toolsSharedOn, handoffSentOn) set to null;
       and the account appears in the next GET /api/accounts

R5 [must] — Reject an invalid account
  When a client sends POST /api/accounts with a JSON body
  If   a required field is missing or an empty string, startDate is not a real
       YYYY-MM-DD date, customerType is not "new_business" or "existing_customer",
       owner or any authorizedContacts entry lacks a non-empty name or a valid
       email (valid = one "@" with text before it and a domain containing a "."
       after it, no spaces), or authorizedContacts is present but is not an array
  Then the response is 400 with JSON { "error": "<message naming the field>" }
       and nothing is stored

R6 [must] — Due dates follow the chain
  When the app computes an account's schedule
  Then T1 Welcome is due on the start date (Day 0); T4 Plan and next steps is due
       1 day after the kickoff call date once that date is today or past and the
       call was not a no-show, or 1 day after the call was waived (R21);
       T5 Tools and walkthrough is due 7 days after T4 was completed;
       T6 Support handoff is due 7 days after T5 was completed;
       a touchpoint whose triggering event has not happened shows "not yet scheduled"

R7 [must] — Reminders while waiting on the customer
  When the loop is waiting on the customer: the anchor has been sent, there is
       no current booking, and the call is not waived
       (anchor = rescheduleOutreachSentOn if set, otherwise welcomeSentOn;
       current booking = kickoffBookedOn is set and kickoffOutcome is not
       "no_show"; after a no-show the loop does not run until
       rescheduleOutreachSentOn is set, so only Reschedule outreach is due)
  Then T2 Reminder is due 3 days after the anchor, and again 3 days after each
       reminder sent, with no limit, counting only reminders in remindersSentOn
       dated on or after the anchor; after the second such reminder the account
       also turns red under R9 so the OBM escalates
       (amended 2026-11-18: owner says outreach continues past 2 reminders)

R8 [must] — Due today list
  When the OBM opens the Due today page at /
  Then they see one row per touchpoint that is due today or overdue, each row
       showing the account name, the touchpoint name, days overdue (0 = due today),
       and the account's health text from R14; plus one row per account that is red
       for not responding, showing touchpoint "Escalate to Account Manager and
       team lead" and the status "Red · no response after 2 reminders"; that row
       clears once there is a current booking or the call is waived

R9 [must] — Health status
  When the app computes an account's health
  Then it is red if its most overdue touchpoint is 4 or more days overdue, or if
       2 reminders counted under R7 have gone out and 3 more days have passed
       while the loop is still waiting on the customer (no current booking and
       not waived, as R7 defines it);
       yellow if its most overdue touchpoint is 1-3 days overdue; otherwise green
       (a touchpoint due today does not change health)

R10 [should] — Most overdue first
  When the Due today list has rows
  Then rows sort by days overdue, highest first; ties sort by account name A-Z;
       "not responding" rows sort above all others, A-Z among themselves

R11 [should] — Handoff waits on open issues
  When T6 Support handoff would be due
  If   openTicketCount is 1 or more
  Then T6 shows "on hold: <n> open tickets" instead of being due, and does not
       count as overdue

R12 [must] — Ticket counts from a ticket source
  When the Due today page loads
  Then it asks a TicketSource for each account's open tickets (tickets whose
       requester email matches the owner or an authorized contact) and passes the
       count into computeSchedule (null when unavailable, see R16); in this slice the source is a fake returning
       seeded sample tickets keyed to the seed account ids, so accounts created
       by POST have 0 tickets

R13 [must] — "Today" is the OBM's date
  When the app decides what is due today
  Then todayInChicago(now) returns the calendar date in America/Chicago, so
       2026-11-19T03:00:00Z (9 PM on the 18th in Chicago) counts as 2026-11-18

R14 [should] — Status is readable without color
  When a health status is shown
  Then it appears as text as well as color: "Red · 4 days overdue",
       "Red · no response after 2 reminders", "Yellow · 2 days overdue", "Green";
       if an account is red for both reasons, the no-response text is shown

R15 [must] — Sample data only
  When the app ships seed accounts or seed tickets
  Then every company, person, and ticket in them is invented, and every email
       uses the reserved example.com domain; no real customer data

R16 [must] — Ticket source unavailable
  When the Due today page asks the TicketSource for an account's tickets
  If   the source throws or does not answer within 3 seconds
  Then fetchTicketCounts returns null for that account, T6 shows "tickets unavailable"
       instead of being due or on hold, and the rest of the page still renders

R17 [must] — Body is not JSON
  When a client sends POST /api/accounts
  If   the body cannot be parsed as JSON
  Then the response is 400 with JSON { "error": "Request body must be JSON" }
       and nothing is stored

R18 [must] — Nothing due
  When the OBM opens the Due today page
  If   no touchpoint is due today or overdue
  Then the page shows "Nothing due today. Every account is on track."

R19 [must] — Kickoff call states
  When the app computes T3 Kickoff call
  Then it is "waived" if kickoffOutcome is "waived"; "no-show <date>" if
       kickoffOutcome is "no_show"; "not booked" while kickoffBookedOn is null;
       "booked for <date>" while kickoffCallOn is in the future; and "held <date>"
       once kickoffCallOn is today or past (kickoffOutcome "held", or null because
       nothing was recorded); T3 is never itself due or overdue (the customer books
       it; the OBM's work while waiting is T2 Reminder); kickoffBookedOn and
       kickoffCallOn are always both null or both set; kickoffWaivedOn is set
       exactly when kickoffOutcome is "waived"; rescheduleOutreachSentOn is set
       only when kickoffOutcome is "no_show"; seed validation rejects a record
       that breaks any of these
       (amended 2026-11-18: no-show and waived states added; an unrecorded
       outcome still counts as held so a forgotten entry never stalls T4)

R20 [must] — Kickoff no-show
  When kickoffOutcome is "no_show"
  Then a "Reschedule outreach" touchpoint is due 1 day after kickoffCallOn;
       once it is sent, the account counts as having no current booking and the
       R7 reminder loop restarts from rescheduleOutreachSentOn; when the customer
       rebooks, kickoffBookedOn and kickoffCallOn hold the new dates and
       kickoffOutcome returns to null, so T4 and everything after it follow the
       new call

R21 [must] — Kickoff waived
  When kickoffOutcome is "waived"
  Then no reminder is due, T3 shows "waived", and T4 Plan and next steps is due
       1 day after kickoffWaivedOn

R22 [should] — No week without contact
  When 7 days have passed since the last date anything was sent to or held with
       the customer (welcome, reminders, reschedule outreach, a held call, plan,
       tools, earlier check-ins)
  If   no other touchpoint for the account is due on or before that seventh day,
       and T6 Support handoff has not been sent
  Then a "Check-in" touchpoint is due on the seventh day; sending it is recorded
       in checkInsSentOn
```

## Data examples

Illustrative values (invented). Today is 2026-11-18.

```
Record (stored facts only; this is what GET /api/accounts/{id} returns)
{
  "id": "a1b2c3",
  "accountName": "Prairie Oak Bakery",
  "owner": { "name": "Dana Whitfield", "email": "dana@prairieoak.example.com" },
  "planSize": "Small",
  "customerType": "new_business",
  "authorizedContacts": [
    { "name": "Sam Ortiz", "email": "sam@prairieoak.example.com" }
  ],
  "startDate": "2026-11-02",
  "welcomeSentOn": "2026-11-02",
  "remindersSentOn": [],
  "kickoffBookedOn": "2026-11-04",
  "kickoffCallOn": "2026-11-10",
  "kickoffOutcome": "held",
  "kickoffWaivedOn": null,
  "rescheduleOutreachSentOn": null,
  "checkInsSentOn": [],
  "planSharedOn": null,
  "toolsSharedOn": null,
  "handoffSentOn": null
}

Derived (computeSchedule(record, "2026-11-18", 0))
  T1 Welcome                 done 2026-11-02
  T2 Reminder                not needed (call booked 2026-11-04, within 3 days)
  T3 Kickoff call            held 2026-11-10
  T4 Plan and next steps     due  2026-11-11   7 days overdue
  T5 Tools and walkthrough   not yet scheduled (waits on T4)
  T6 Support handoff         not yet scheduled (waits on T5)
  Check-in                   not needed (T4 was already due before 2026-11-17)
  Health: Red · 7 days overdue
```

What this proves: nothing in the record goes stale. The due date, the overdue count, and the health color all come from dates that never change once recorded.

```
Request    POST /api/accounts
           { "accountName": "Juniper Dental",
             "owner": { "name": "Lee Park", "email": "lee@juniper.example.com" },
             "planSize": "Small", "customerType": "new_business",
             "startDate": "2026-11-31" }
Response   400 { "error": "startDate must be a real date in YYYY-MM-DD format" }
```

What this proves: a well-formed but impossible date (November has 30 days) is rejected, not silently rolled over to December 1.

## Mockups

No mockups exist yet.

## Decisions

1. **Relative chain, not fixed days.** Chose due dates computed from the previous event over a fixed calendar ("Day 7 = check-in"). Because the owner's experience is that most touchpoints are triggered by the one before (call → plan the next day → tools a week later), and a late call is exactly what pushes accounts past 30 days. Consequence: a single late step visibly delays everything after it, which is the slip the tool exists to show.
2. **Store facts, derive status.** Chose storing event dates over storing a day number, due dates, or a health color. Because derived values go stale overnight, and keeping them updated by hand is the spreadsheet chore this replaces. Consequence: every page that shows status calls the one schedule module; the API returns stored facts only. *(amended 2026-11-18: review F7; originally said every endpoint calls it.)*
3. **Day 0 is the start date.** Chose Day 0 over Day 1, because the only work on the first day is opening the account and sending the welcome. Consequence: T1 is due on the start date itself.
4. **One OBM's own book.** Chose a personal tool over a team-wide view. Because the owner pictures the tool for an individual OBM, and team assignment already happens elsewhere (round robin). Consequence: no OBM or assignee field; a team view would need one later.
5. **In-memory store first.** Chose a module-level array over a database for this slice, to learn and test the API shape before adding persistence. Consequence: accounts created by POST disappear when the dev server restarts; the store lives on `globalThis` so hot reload does not reset it; a later slice adds SQLite or Postgres behind the same functions. *(amended 2026-11-18: review F11.)*
6. **Read tickets, never rebuild them.** Chose a TicketSource interface (fake now, Zendesk REST later) over building ticketing into the app. Because support already runs on Zendesk. Consequence: the page fetches counts and passes them into the schedule, so the schedule stays pure and the Zendesk version swaps in without touching it. *(amended 2026-11-18: review F1; the schedule takes the count as a parameter.)*
7. **API as Next.js route handlers.** Chose route handlers in the same app over a separate backend service. Because one deploy is enough for one user, and the Next.js stack matches open applications. Consequence: the API and the pages share types directly.
8. **Server-generated ids.** Chose ids created by the server (`crypto.randomUUID()`) over ids sent by the client, because the server is the only place that can guarantee two accounts never share an id. Consequence: POST is not idempotent (sending it twice creates two accounts), which is standard for "create" and is noted for the slice that adds editing. *(amended 2026-11-18: review F12, reason added.)*
9. **One fixed time zone.** Chose America/Chicago for deciding "today" over per-user time zones, because there is one user in this slice. Consequence: an OBM elsewhere would need a setting later.
10. **Vitest for tests.** Chose Vitest over Jest because it handles TypeScript and ES modules with little setup and has a Next.js guide. Consequence: a one-time setup step (see How we prove it); tests run with `npm test`.
11. **Rows are touchpoints, health is per account.** Chose one Due today row per due touchpoint, sorted by days overdue, over one row per account grouped by color. Because an OBM works through tasks, and an account can owe two things at once. Consequence: the row shows the touchpoint's own overdue count; the account's health color appears beside it. *(added 2026-11-18: review F4.)*

12. **Reminders have no cap; red means escalate.** Chose reminders every 3 days with no limit over stopping after 2, because the owner says outreach continues while the OBM escalates to the Account Manager and team lead. Consequence: an unresponsive account keeps producing reminder rows and stays red until the customer books or the call is waived. *(added 2026-11-18: owner amendment.)*
13. **An unrecorded call outcome counts as held.** Chose "held unless marked otherwise" over waiting for the OBM to record an outcome, because a forgotten entry should not silently stall T4 and everything after it. Consequence: a no-show must be recorded, or the schedule moves on as if the call happened. *(added 2026-11-18: owner amendment.)*
14. **Check-ins only fill silences.** Chose a check-in only when no other touchpoint is due within the 7 days over a fixed weekly check-in, because a planned touchpoint already counts as contact. Consequence: on a healthy account check-ins never appear; they show up only when a delay leaves a gap. *(added 2026-11-18: owner amendment.)*

15. **Email links contacts to tickets.** Chose storing each contact as { name, email } with the email required, over names only or emails in a separate list. Because the ticketing system identifies requesters by email, so the email is the only reliable way to attach a ticket to an account, and keeping name and email in one object means they cannot drift apart. Consequence: `ownerName` became `owner`; the Zendesk TicketSource will search by these emails, while the slice-1 fake stays keyed by account id. *(added 2026-11-18: owner amendment.)*

## Out of scope

- A per-account timeline page (`/accounts/[id]`) showing all of an account's touchpoints — slice 2; the schedule module already computes it, so the page is display only.
- Different paths by customer type — only the new-business path is modeled; existing customers adding a site get the same chain until the Lead OBM describes the difference.
- Marking touchpoints complete in the app — slice 2, as the first PATCH endpoint; this slice reads seeded completion dates.
- Message text and macros (editable templates or pulling Zendesk macros) — refused for now because the touchpoint list itself is not yet validated.
- Sending any message, email, or Calendly link — the app tracks what is owed; the OBM still sends it.
- Running an escalation (the Slack channel with the Account Manager and team lead) — the app only flags that one is needed.
- Keeping a history of earlier no-shows or reschedules — only the current booking is stored (Q10).
- A team view across OBMs, logins, and permissions — one user, no auth, in this slice.
- A database — slice 3.
- Real WP Engine or customer data of any kind.
- AI-drafted check-ins and ticket summaries — later, with a human review step.

## Open questions

- [x] Q1 Where is the line for "red"? — resolved: `4+ days overdue`, so the usual 3-day follow-up window stays yellow (owner, 2026-11-18)
- [ ] Q2 What counts as "not engaging"? — proposed default: `2 reminders sent, 3 more days, no call booked` [ASSUMPTION] · blocks: `no`
- [x] Q3 Does slice 1 keep touchpoints read-only? — resolved: `yes; seeded completion dates, PATCH in slice 2` (owner, 2026-11-18)
- [ ] Q4 Is the reminder timer 3 days? — proposed default: `3 days` [ASSUMPTION, confirm with the Lead OBM] · blocks: `no`
- [ ] Q5 How does the path differ for an existing customer adding a site? — proposed default: `same chain` · blocks: `no`
- [ ] Q6 Is T1-T6 plus Reschedule outreach and Check-in the full touchpoint list, in this order? — proposed default: `yes` [ASSUMPTION, confirm with the Lead OBM] · blocks: `no`
- [ ] Q7 What are the plan size values? — proposed default: `free text` · blocks: `no`
- [ ] Q8 Does any open ticket hold the handoff, or only ones the OBM flags? — proposed default: `any open ticket` · blocks: `no`
- [ ] Q9 Does T5 count from when T4 was completed, or from when T4 was due? — proposed default: `completed` · blocks: `no`
- [ ] Q10 If the kickoff call is rescheduled, does the earlier date matter? — proposed default: `no; store only the latest call date` · blocks: `no`
- [x] Q11 Is a call assumed held once its date passes? — resolved: `only when no outcome is recorded; no-show and waived are explicit outcomes (R19-R21)` (owner, 2026-11-18)
- [x] Q12 Are 2 reminders the real cap? — resolved: `no cap; outreach continues every 3 days, and after 2 unanswered reminders the OBM escalates to the Account Manager and team lead` (owner, 2026-11-18)
- [ ] Q13 Is "never a week without contact" a real rule, and is 7 days the number? — proposed default: `yes, 7 days` [ASSUMPTION, confirm with the Lead OBM] · blocks: `no`
- [ ] Q14 After the second reminder, is every 3 days still the right cadence? — proposed default: `3 days` [ASSUMPTION] · blocks: `no`

- [ ] Q15 Can the same email belong to two accounts (an existing customer bringing over another account)? If so, whose ticket is it? — proposed default: `count the ticket for every account that lists the email` [ASSUMPTION] · blocks: `no`

## Review

Round 1 · fresh-context reviewer · 2026-11-18

| Dimension | Score | Evidence |
|---|---|---|
| Context completeness | 4/5 | Clear boundary and honest risks; no UI route named |
| Requirement testability | 3/5 | Sort order and Central time untestable at bound seams |
| Readiness | 2/5 | Ticket signature, T3 meaning, row model unclear |
| Implementation confidence | 3/5 | Good seams; schedule signature incomplete |
| Risk coverage | 2/5 | No ticket failure, non-JSON, or empty-list paths |
| Decision traceability | 4/5 | D8 had no reason |
| **Total** | **18/30** | Verdict: **REVISE** |

Findings: F1 blocker schedule cannot see tickets → fixed (signature, R12, D6) · F2 major R13 untestable → fixed (`todayInChicago`, R13) · F3 major T3 undefined → fixed (R19, Q11) · F4 major row model ambiguous → fixed (R8, R10, D11) · F5 major reminder loop open → fixed (R7, R9, R14, Q12) · F6 major unhappy paths missing → fixed (R16, R17, R18) · F7 major D2 contradicts API → fixed (D2, R1, R2) · F8 major title feature has no requirement → fixed (title narrowed, page route `/` in R8, timeline page out of scope) · F9 minor POST defaults → fixed (R4, R5, R12) · F10 minor Vitest missing → fixed (setup step) · F11 minor hot reload, seed path → fixed (D5, R15) · F12 minor D8 reason → fixed (D8)

Round 2 (changed parts only) · same reviewer · 2026-11-18

| Dimension | Score | Evidence |
|---|---|---|
| Context completeness | 4/5 | Title narrowed, route named; no target metric |
| Requirement testability | 4/5 | Pure seams; R16 timeout needed its own seam |
| Readiness | 4/5 | Signature, T3, reminders, rows settled |
| Implementation confidence | 4/5 | Fetch-with-timeout had no home |
| Risk coverage | 4/5 | Failure, non-JSON, empty paths added |
| Decision traceability | 5/5 | Dated amendments cite findings |
| **Total** | **25/30** | Verdict: **SHIP** |

Findings: F13 major R16 unprovable at its seam → fixed (tickets module seam, R16 row) · F14 minor null type unstated → fixed (signatures) · F15 minor booked call without a date → fixed (R19 invariant) · F16 minor row contents disagree → fixed (R8, R10, R14 bound to `healthLabel`) · cosmetic casing and `vitest run` → fixed

Review cycle 2 (owner amendments after SHIP), round 1 · same reviewer · 2026-11-18

| Dimension | Score | Evidence |
|---|---|---|
| Context completeness | 4/5 | Escalation and history scoped out; open questions stale |
| Requirement testability | 4/5 | New R-IDs bound; R7 and R14 checks mismatched |
| Readiness | 3/5 | Reminder counting after a no-show undefined |
| Implementation confidence | 4/5 | Kickoff state order explicit; check-in example holds |
| Risk coverage | 4/5 | No invariant tying waived to its date |
| Decision traceability | 4/5 | New rules had no Decision entries |
| **Total** | **23/30** | Verdict: **REVISE** |

Findings: F17 major reminder counting after a no-show → fixed (R7 anchor and current booking, R9) · F18 minor R7 and R14 checks mismatched → fixed (test names, R14 precedence) · F19 minor waived invariant → fixed (R19) · F20 minor stale Q6 and scope → fixed (Q6, Out of scope, R8 clear condition) · decision gap → fixed (D12-D14)

Cycle 2, round 2 (changed parts only) · same reviewer · 2026-11-18: Context completeness 4 · Requirement testability 4 · Readiness 3 · Implementation confidence 4 · Risk coverage 4 · Decision traceability 5 · **Total 24/30 · Verdict: REVISE**

Findings: F21 major no-show restarts old reminder loop early → fixed (R7: loop paused until reschedule outreach is sent) · F22 minor waived account can stay red → fixed (R7 "not waived", R9, D12). Fixed after the cycle's final round; not formally re-scored (see Status).

v0.4 change (owner, 2026-11-18, no review round): contacts become { name, email } with email required for the owner and every authorized contact; touches R4, R5, R12, R15, the data examples, D15, Q15.

## Risks

- The touchpoint chain comes from the owner's memory of about two months as an OBM, after four years in technical onboarding. Every timing in R6, R7, R9, R19, R20, R21, and R22 is an assumption until the Lead OBM reviews it; their sample spreadsheet has not arrived yet.
- Accounts created by POST still vanish on a full dev server restart (hot reload is covered by D5).
- A Zendesk trial or developer account for the later TicketSource has not been confirmed to exist.
