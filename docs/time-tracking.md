# Time tracking — requirements and plan

## Goal
Team members log the time they spend on each story (task). Admins see how much time
went into every task, every epic, every person, and the total for the whole project.

## Roles
| Role | Who | Can do |
|---|---|---|
| Team member | Any email on the team list | Log time on any story, see each story's total, see and delete **their own** entries |
| Admin | The owner accounts (always) + anyone an admin marks as admin in *Team & access* | Everything a member can, plus: open the **Time** dashboard, see and delete **all** entries, export CSV, grant/revoke admin |

## User stories
1. **Log time** — As a team member, I want to log hours and minutes against a story with a date
   and an optional note, so that my work on it is recorded.
   - "Log time" is on every card (Board) and every story row (Epics).
   - Date defaults to today, cannot be in the future. Time must be > 0 and ≤ 24 h per entry.
   - The entry stores who logged it (email + name) and when.
2. **See time on a task** — As a team member, I want to see the total logged on a card, so I know
   how much effort the task has taken. Cards show a clock chip once time > 0.
3. **Fix a mistake** — As a team member, I want to delete my own entry. Admins can delete any entry.
4. **Track time per task** — As an admin, I want a *Time* tab listing every task with logged time
   (total, who logged how much, last date), sorted by most time.
5. **Total spent time** — As an admin, I want the project total in the dashboard (and in the page
   header), plus totals per person and per epic.
6. **Filter and export** — As an admin, I want to filter by period (all / this week / this month)
   and by person, and download the filtered entries as CSV.
7. **Manage admins** — As an admin, I want to make a teammate an admin or remove that right.

## Out of scope (for now)
Start/stop timers, estimates vs. actuals, editing an entry (delete and re-log instead),
billing rates.

## Data model
Entries live **inside the story document**, so no new collection and no Firestore rules change:

```
stories/{id}.logs = { "<logId>": { email, name, minutes, date:"YYYY-MM-DD", note, at } }
config/team.admins = [ "email", ... ]      // owner accounts are always admins
```

Each entry is its own map key, written with a merge — two people logging at the same time
never overwrite each other. Deleting removes just that key.

**Note on enforcement:** the admin/member split is enforced in the UI. Firestore rules still give
every team member read/write on stories (as before), so this is about a tidy workflow, not about
hiding data from teammates.

## Plan
1. Helpers: `isAdmin`, `logsOf`, `minsOf`, `fmtMin`, local-date helpers.
2. Log-time modal (form + entry list) and `addLog` / `delLog` writes (optimistic, revert on error).
3. Card: clock chip + "Log time" action; total in the expanded detail. Epics tab: time per story and per epic.
4. Admin **Time** tab: summary tiles, period/person filters, by person, by epic, by task, recent entries, CSV export.
5. Header: total time logged (admins).
6. *Team & access*: admin badges and make/remove admin.
7. Test in the browser, commit, push to `main` (GitHub Pages deploys automatically).
