# Invoicing from logged time — requirements and plan

## Goal
An admin turns the time the team logged into a client invoice, without typing hours by hand
and without ever billing the same hours twice.

## User stories (admin only)
1. **Set rates once** — currency, default hourly rate, optional rate per person, tax %, payment
   terms, my business details and the default client. (*Invoices → Rates & billing details*)
2. **See what is unbilled** — tiles for unbilled time, unbilled value, awaiting payment, paid.
3. **Create an invoice** — pick a work period (and optionally one person); the form shows live how
   many entries, how much time and what total it will bill. Invoice no. is suggested (INV-001, …),
   date = today, due date = today + payment terms. All editable.
4. **One line per task** — task key and title, hours, rate, amount. If people with different rates
   worked on the same task it gets one line per rate. Subtotal, tax, total. A "Time details"
   appendix lists every entry (date, task, person, note, time).
5. **Print / Save as PDF** — the browser print dialog shows only the invoice sheet.
6. **Track status** — Draft → Sent → Paid.
7. **No double billing** — entries on an invoice are marked with its number, are skipped by later
   invoices and cannot be deleted. Deleting an invoice releases its entries again.

## Out of scope (for now)
Editing an invoice after creation (delete and re-create), fixed-price/expense lines, discounts,
emailing the invoice, multiple currencies per invoice.

## Data model (no Firestore rules change — `board/{doc}` is already team-only)
```
board/billing   { currency, defaultRate, rates:{emailKey:rate}, taxPct, termsDays, nextNo,
                  from:{name,address,contact}, client:{name,address,email}, notes }
board/inv-<id>  frozen copy: { no, date, due, periodFrom, periodTo, from, client, currency,
                  lines:[…], entries:[…], subtotal, taxPct, tax, total, notes, status }
stories/{id}.logs.<logId>.invoice = "<invoice no>"
```
Invoice, number counter and entry marks are written in one atomic batch.

## Plan
1. Watch the `board` collection (billing + invoices); helpers for rates, money, unbilled entries, lines.
2. Invoices tab: tiles, list, "Rates & billing details" modal, "New invoice" modal with live summary.
3. Invoice sheet view with status, print CSS, delete with confirm.
4. Protect invoiced entries in the log-time dialog.
5. Test with stubbed data, push to `main`.
