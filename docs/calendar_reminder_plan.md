# Calendar, Reminder, and Meeting Scheduling Plan

This document proposes **project-specific** and **user-specific** calendar features for this Rails + Vite app, with implementation guidance based on the current architecture.

## 1) What already exists (reuse first)

The app already has:

- Task and sprint workflows (`/api/tasks`, `/api/sprints`) and scheduler-related UI components.
- Notifications (`/api/notifications`) and background jobs/mailers.
- Project membership (`projects`, `project_users`) and user-level preferences fields.

So calendar can be built as an extension of existing objects instead of a separate isolated system.

## 2) Calendar models to implement

### A. Project Calendar (team-facing)
Use this for things shared by a project/team:

- Sprint ceremonies (planning, review, retro)
- Release deadlines
- Client/demo meetings
- Shared milestones

**Ownership**
- `project_id` required
- visible to all project members

### B. Personal Calendar (employee-facing)
Use this for individual work planning:

- Focus blocks
- 1:1s
- Interview slots
- Reminder-only items (no meeting)

**Ownership**
- `user_id` required
- optionally linked to `project_id` or `task_id`

### C. Unified Event Table (recommended)
Instead of separate tables for project/personal calendars, create one table with scope flags:

- `calendar_events`
  - `title`, `description`
  - `start_at`, `end_at`, `all_day`
  - `event_type` (meeting, deadline, reminder, focus, sprint_ceremony)
  - `visibility` (personal, project)
  - `user_id` (owner)
  - `project_id` (optional for personal, required for project visibility)
  - `task_id` / `sprint_id` (optional links)
  - `location_or_meet_link`
  - `status` (scheduled, cancelled, completed)
  - `recurrence_rule` (later phase)

This keeps reporting and UI simpler while still supporting both calendars.

## 3) Reminder system design

### Reminder data model
Add `event_reminders`:

- `calendar_event_id`
- `channel` (in_app, email, slack)
- `minutes_before` (e.g., 10, 30, 1440)
- `send_at` (precomputed)
- `sent_at`
- `state` (pending, sent, failed)

### Delivery flow
1. Event created/updated.
2. Reminder timestamps recalculated.
3. Background job enqueues deliveries.
4. Create in-app notification (existing notifications pipeline).
5. Optional email via mailer.

Start with **in-app + email**, add Slack later.

## 4) API endpoints to add (under `/api`)

- `GET /calendar_events`
  - filters: `start`, `end`, `project_id`, `visibility`, `mine_only`
- `POST /calendar_events`
- `PATCH /calendar_events/:id`
- `DELETE /calendar_events/:id`
- `POST /calendar_events/:id/reminders`
- `PATCH /event_reminders/:id`
- `DELETE /event_reminders/:id`

Optional optimization:
- `GET /calendar_feed`
  - returns merged payload: events + lightweight linked task/project metadata

## 5) Front-end UX options (Vite React)

### Option 1 (Fast MVP)
- Add a new `Calendar` page.
- Month/Week toggle.
- Event dots/cards.
- Create/edit modal.
- Reminder selector (10 min, 30 min, 1 day).

### Option 2 (Operational view)
- Calendar + right-side "Today" agenda panel.
- Drag/drop event rescheduling.
- "My Day" quick planner.

### Option 3 (Manager/Team view)
- Team calendar heatmap and conflict markers.
- Filters by project/member/event type.
- Meeting load analytics.

Recommended rollout: **Option 1 -> Option 2 -> Option 3**.

## 6) Project-specific vs user-specific display strategy

Default screen should show merged data with clear coloring:

- Blue = personal
- Green = project events
- Red = deadlines

Top filters:
- My Events
- My Projects
- Team Events
- Deadlines only

For managers, add "member lanes" in week view to detect overload.

## 7) Suggested employee-focused features

High-impact features to reduce employee effort:

1. **Task -> calendar in one click**
   - from task card, create event prefilled with title and due date.
2. **Smart reminders**
   - default reminder based on event type (e.g., meetings 15m, deadlines 1d).
3. **Conflict detection**
   - warn when creating overlapping meetings.
4. **Daily digest**
   - morning summary of today’s meetings, deadlines, and overdue tasks.
5. **No-meeting focus blocks**
   - recurring deep-work slots that block scheduling.
6. **Attendance/acknowledge actions**
   - "Going/Not Going" for optional project meetings.

## 8) Implementation phases

### Phase 1 (1-2 sprints)
- DB tables: `calendar_events`, `event_reminders`
- CRUD APIs
- Basic calendar UI with month/week + create/edit
- In-app reminder delivery

### Phase 2
- Email reminders
- Recurring events
- Conflict detection
- Task/sprint linkage buttons

### Phase 3
- Team workload analytics
- Slack integration
- ICS import/export + Google Calendar sync

## 9) Where to implement in this codebase

Backend:
- `app/models/calendar_event.rb`, `app/models/event_reminder.rb`
- `app/controllers/api/calendar_events_controller.rb`
- `app/controllers/api/event_reminders_controller.rb`
- `app/jobs/event_reminder_job.rb`
- `app/mailers/calendar_mailer.rb`
- `config/routes.rb`
- `db/migrate/*create_calendar_events.rb`
- `db/migrate/*create_event_reminders.rb`

Frontend:
- `app/javascript/pages/Calendar.jsx`
- `app/javascript/components/Calendar/*`
- Add route entry in app router/navigation
- Reuse existing notification center for in-app alert rendering

## 10) Minimal MVP feature set (best first implementation)

If you want to start quickly without overbuilding, implement exactly this:

- Personal + project events in one calendar screen
- One-time reminders (10m/30m/1d)
- Meeting events with links + attendees (simple text for MVP)
- Deadline events linked to task/project
- Daily agenda widget on dashboard

This will already make employee planning much easier and gives a clean base for advanced automation later.
