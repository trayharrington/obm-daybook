# Render packet — ACC-01 v0.3 (2026-11-18)

v0.3 update: re-read spec.md in full; it is the source of truth. Where this packet and spec.md disagree on counts or text, spec.md wins.

- spec.md: `specs/acc-01-account-timeline/spec.md` (verbatim source of truth; do not add, soften, or invent content)
- template: `.claude/spec-templates/spec.html` (copy its chrome; delete unused blocks)
- output: `specs/acc-01-account-timeline/spec.html`, single file, inline CSS/SVG, no scripts, no external fonts, under 150 KB

## Header chrome

Title "ACC-01 Account schedule and Due today" · v0.3 · 2026-11-18 · Owner: Tray · Status: approved (accepted by owner; see review note) · Depth reason: "HTML because the spec carries an API contract and a data flow across the ticketing boundary (owner's choice; triage suggested markdown only)."

Phase rail: Spec (done) → Review (done) → Build (current) → Tests → Ship.

## Intro triad

- What this solves: An Onboarding Manager tracks every new customer's first weeks by hand, and one missed deadline quietly pushes every later step back.
- How it solves it: The app stores only the dates things happened and calculates every due date, overdue count, and health color from them, then lists what is owed today, most overdue first.
- How we prove it: Each of the 22 requirements is tied to a named test or screenshot at three seams: the schedule calculations, the ticket lookup, and the accounts API.

## 30-second read (exactly these bullets)

- Deadlines are a chain: each touchpoint is due a set number of days after the one before it, so a late step delays everything after it.
- Nothing stored can go stale: the record holds dates; due dates and health are calculated each time.
- Health: green on track, yellow 1-3 days overdue, red 4+ days overdue or no response after 2 reminders (then the OBM escalates).
- The kickoff call can be held, a no-show (reschedule and restart the chain), or waived; a week with no contact triggers a check-in.
- Support tickets come from a ticket source (a fake now, Zendesk later); open tickets hold the final handoff.
- Every timing is an assumption until the Lead OBM reviews it.

## Requirement table (near the top)

One row per R-ID with priority and short title, copied from the spec:
R1 must List accounts · R2 must Get one account · R3 must Unknown account · R4 must Create an account · R5 must Reject an invalid account · R6 must Due dates follow the chain · R7 must Reminders while waiting on the customer · R8 must Due today list · R9 must Health status · R10 should Most overdue first · R11 should Handoff waits on open issues · R12 must Ticket counts from a ticket source · R13 must "Today" is the OBM's date · R14 should Status is readable without color · R15 must Sample data only · R16 must Ticket source unavailable · R17 must Body is not JSON · R18 must Nothing due · R19 must Kickoff call states · R20 must Kickoff no-show · R21 must Kickoff waived · R22 should No week without contact

Coverage strip: all 22 chips lit (every R-ID has a check bound in the spec's "How we prove it" table).

## Review scorecard (after the 30-second read)

Current score: cycle 2, round 2 (24/30, REVISE) with the note, verbatim: "F21-F22 fixed after the cycle's final round; not formally re-scored. Owner accepted v0.3 on 2026-11-18." Use a neutral "Accepted by owner" chip beside the REVISE chip; never change the REVISE chip or the score. Earlier rounds (cycle 2 round 1: 23/30 REVISE; cycle 1 round 2: 25/30 SHIP; cycle 1 round 1: 18/30 REVISE) go inside `<details>` with their scores and findings exactly as in spec.md's Review section. Copy verbatim, do not re-score.

Round 2 · same reviewer · 2026-11-18: Context completeness 4 (Title narrowed, route named; no target metric) · Requirement testability 4 (Pure seams; R16 timeout needed its own seam) · Readiness 4 (Signature, T3, reminders, rows settled) · Implementation confidence 4 (Fetch-with-timeout had no home) · Risk coverage 4 (Failure, non-JSON, empty paths added) · Decision traceability 5 (Dated amendments cite findings) · Total 25/30 · Verdict SHIP. Findings F13-F16 all fixed.

Round 1 · fresh-context reviewer · 2026-11-18: 4, 3, 2, 3, 2, 4 (same dimension order; evidence notes from the spec's Review table) · Total 18/30 · Verdict REVISE. Findings F1-F12 all fixed.

## Diagrams (max 2)

### D-A: Touchpoint chain (kind: sequence, horizontal)

Caption (what it proves): "One late step moves every later due date, because each deadline is counted from the step before it."

Add two branches below T3 (v0.3): "No-show" → "Reschedule outreach (next day)" → dashed arrow back to "T2 Reminder" labeled "loop restarts"; and "Waived" → T4 labeled "T4 = waive date + 1". Add a small separate note node "Check-in: due after 7 days with no contact, only if nothing else is due" (badge R22). Badges R20 on the no-show branch, R21 on the waived branch.

Nodes, left to right: 
- "T1 Welcome" (label under: "Day 0") 
- "T2 Reminder" (label under: "every 3 days until booked") 
- "T3 Kickoff call" (label under: "customer books it; never overdue") 
- "T4 Plan and next steps" (label under: "call date + 1 day") 
- "T5 Tools and walkthrough" (label under: "T4 done + 7 days") 
- "T6 Support handoff" (label under: "T5 done + 7 days; on hold while tickets are open")

Edges: T1→T2 dashed (only if no booking), T1→T3, T2→T3, T3→T4, T4→T5, T5→T6.
Badges: R6 on the chain, R7 on T2, R19 on T3, R11 on T6.
Boundary: "Only the new-business path is shown; other paths are out of scope."

### D-B: Where the Due today list comes from (kind: flow, horizontal)

Caption (what it proves): "Ticket data crosses into the app at one boundary, so the fake source can be swapped for Zendesk without changing the schedule."

Nodes: "Account records (in-memory store)", "TicketSource (fake now · Zendesk later)", "fetchTicketCounts (3 s timeout; failure → unavailable)", "computeSchedule + buildDueToday (pure)", "Due today page (/)".
Edges: Account records → computeSchedule ("stored dates"); TicketSource → fetchTicketCounts ("open tickets per account"); fetchTicketCounts → computeSchedule ("count or unavailable"); computeSchedule → Due today page ("rows, most overdue first").
Boundary marker: a dashed rounded box drawn around the TicketSource node only, labeled "outside the app" directly above that box. Put each edge label directly above its own arrow (the "open tickets per account" label sits on the TicketSource → fetchTicketCounts arrow).
Badges: R12 and R16 on fetchTicketCounts, R8 R9 R10 R13 on computeSchedule, R18 on the page.

## Data examples (verbatim from the spec)

1. Label "Record → Derived", direction before-after. Left: the Prairie Oak Bakery JSON record exactly as in the spec. Right: the derived schedule block exactly as in the spec (T1 to T6 lines plus "Health: Red · 7 days overdue"). Caption: "Nothing in the record goes stale: due dates, overdue count, and health are all calculated from dates that never change." Badges: R6, R9, R19.
2. Label "Request → Response", direction request. The POST /api/accounts body with "startDate": "2026-11-31" and the 400 response, exactly as in the spec. Caption: "An impossible date is rejected, not rolled over to December 1." Badge: R5.

## API contract (table, one row per field)

Account record fields, from the spec's record example and R4/R5:
id · string · server-generated · unique id (R4)
accountName · string · required · company name
ownerName · string · required · main customer contact
planSize · string · required · free text for now (Q7)
customerType · "new_business" or "existing_customer" · required · which onboarding path the account follows (only new_business is modeled; Q5)
authorizedContacts · array of non-empty strings · optional, default [] · other people allowed to work with the OBM
startDate · YYYY-MM-DD · required · Day 0
welcomeSentOn, kickoffBookedOn, kickoffCallOn, planSharedOn, toolsSharedOn, handoffSentOn · YYYY-MM-DD or null · set to null on create
remindersSentOn · array of YYYY-MM-DD · set to [] on create
kickoffOutcome · "held", "no_show", "waived", or null · null on create · null counts as held (R19)
kickoffWaivedOn · YYYY-MM-DD or null · set only when waived (R21)
rescheduleOutreachSentOn · YYYY-MM-DD or null · only after a no-show (R20)
checkInsSentOn · array of YYYY-MM-DD · set to [] on create (R22)

Endpoints (second small table): GET /api/accounts → 200 (R1) · GET /api/accounts/{id} → 200 or 404 (R2, R3) · POST /api/accounts → 201, or 400 for invalid fields or a non-JSON body (R4, R5, R17).

## How we prove it (place right after the requirement table and coverage strip)

One-sentence takeaway: "Three seams below the UI, so every check runs as a fast test without a browser."
Seams table, verbatim from the spec's first "How we prove it" table (3 rows: Schedule module, Tickets module, Accounts route handlers; columns Seam / What it pins / Kind).
Then a `<details>` with summary "Which check proves each requirement (19 rows)" containing the spec's R-ID → Check → Evidence target table verbatim.
Then one line: the Vitest setup step, verbatim from the spec.

## Full requirements

Render all 22 when/if/then blocks verbatim from the spec inside `<details>` with summary line "All 22 requirements (when / if / then)".

## Decisions

2-column cards (chosen / rejected-with-reason) for D1, D2, D6, D11, which shape the build most; D3-D5, D7-D10, and D12-D14 in a `<details>` list, verbatim titles plus one-sentence decision each. Show amended markers as given.

## Out of scope

Simple list, verbatim, 11 items.

## Open questions

Checklist, 14 items verbatim. Q1, Q3, Q11, and Q12 checked with their resolutions; the rest unchecked with proposed default and "blocks: no". Mark [ASSUMPTION] items with a small chip.

## Risks

Callout blocks, 3, verbatim from the spec. Severity: first one "high" (owner: Tray, validate with Lead OBM), others "low" (owner: Tray).

## Layout plan

Order: header + phase rail → triad → 30-second read → requirement table + coverage strip → how we prove it → scorecard → D-A chain diagram → D-B flow diagram → data examples → API contract → decisions → out of scope → open questions → risks → full requirements (details) → footer.
Footer: canonical source `specs/acc-01-account-timeline/spec.md` · "This is a generated view — edit the md, not this file."
Must not scroll sideways at 390 px wide.
