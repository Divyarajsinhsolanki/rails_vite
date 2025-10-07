# Teams Skill Experience Enhancement Plan

This plan describes the incremental work required to bring the functionality from the provided React components (skill matrix, expert search, endorsements, and learning goals) into the existing Rails + React codebase. Each task is scoped so it can be executed sequentially as separate Codex runs.

## Current Application Touchpoints

* The Teams page (`app/javascript/pages/Teams.jsx`) already loads team data and renders the sidebar/detail management UI. This is the natural integration point for the skill-related tabs.
* All front-end API helpers live in `app/javascript/components/api.jsx`; new API calls for skills, endorsements, and goals should be added alongside the existing team helpers.
* Server-side JSON endpoints sit under `app/controllers/api`. The teams API (`app/controllers/api/teams_controller.rb`) and team-user API (`app/controllers/api/team_users_controller.rb`) illustrate patterns to follow for new controllers.

## Data & Domain Design Tasks

**Task 1 – Skill Domain Modeling**
1. Create migrations and ActiveRecord models for:
   * `Skill` (name, category optional).
   * `UserSkill` (user reference, skill reference, proficiency enum, years_experience, notes).
   * `TeamSkill` or reuse `UserSkill` scoped by team via `team_users` join. Add a `team_id` foreign key to `user_skills` for faster queries when the skill is team-specific.
2. Add model-level validations (presence of user, skill, proficiency) and enums for proficiency levels (e.g., `beginner`, `intermediate`, `advanced`, `expert`).
3. Seed initial skills if desired and update factories/fixtures for automated tests.

**Task 2 – Endorsements & Availability Modeling**
1. Add a `SkillEndorsement` model that belongs to a `user_skill` and the endorsing `user`, tracks counts, and prevents duplicate endorsements per endorser.
2. Extend the `users` table with availability information (enum or string) and optionally role seniority for filtering.
3. Ensure associations (`user has_many :user_skills`, `user has_many :skill_endorsements` etc.) are added to the `User` model.

**Task 3 – Learning Goals Modeling**
1. Create `LearningGoal` (user, title, due_date, progress cached) and `LearningGoalCheckpoint` (goal, description, done flag, resource link, position) tables.
2. Add callbacks to recompute goal progress when checkpoints change.
3. Wire associations on `User` (`has_many :learning_goals`).

## Backend API Tasks

**Task 4 – Skills & Matrix API**
1. Build `Api::SkillsController` for CRUD on skills (admin only) and an index endpoint for filters.
2. Build `Api::UserSkillsController` to manage skills per user, supporting nested operations for proficiency updates and endorsements counts.
3. Add a `Teams::SkillMatrixController` (e.g., `Api::TeamSkillMatricesController`) that returns:
   * Team members (from existing `Team`/`TeamUser`).
   * Skills list aggregated from members.
   * Per-member proficiency map to drive the matrix UI.
4. Ensure N+1 queries are avoided via `includes` and add policy checks mirroring `authorize_leader!` patterns from the existing teams controller.

**Task 5 – Expert Search API**
1. Add an index action (e.g., `Api::TeamExpertsController#index`) that accepts query params for skills, role, availability, and search term; reuse ActiveRecord scopes on `User` to filter.
2. Return endorsements counts, active project counts (if available through associations), and availability for each user in the payload.
3. Update routes under `config/routes.rb` to expose `/api/teams/:team_id/experts` and general `/api/experts` if cross-team searches are needed.

**Task 6 – Endorsement Actions**
1. Implement `Api::SkillEndorsementsController` with `create` and `destroy` actions. The create endpoint should increment counters and prevent duplicate endorsements by leveraging uniqueness validations.
2. Add background job hooks if endorsement notifications are required later (enqueue using ActiveJob but leave job empty for now if out of scope).

**Task 7 – Learning Goals API**
1. Expose CRUD endpoints for goals and checkpoints (`Api::LearningGoalsController`, `Api::LearningGoalCheckpointsController`).
2. Provide a summary endpoint (e.g., `/api/learning_goals/summary`) that returns the “Most Developed Skills” and “Needs Development” aggregates used by the front-end widget.
3. Authorize access so users can manage their own goals, and team leaders can view goal summaries for members where appropriate.

## Front-End Integration Tasks

**Task 8 – API Client Wiring**
1. Extend `app/javascript/components/api.jsx` with fetch/update helpers for the new endpoints created above.
2. Follow the same axios instance used for teams to keep CSRF handling consistent.

**Task 9 – Component Refactors**
1. Move the provided React components into `app/javascript/components/teams/` (or similar) and convert static data to hooks that consume the new API helpers.
2. Replace hard-coded members/skills/endorsements with actual responses:
   * Matrix: fetch matrix payload when a team is selected (subscribe to `selectedTeamId` from `Teams.jsx`).
   * Skill search: drive filters from API data, and propagate selections back to parent state as needed.
   * Endorsements: allow endorsing via API calls and disable the button after success.
   * Learning goals: fetch and mutate user goals, wiring checkbox toggles to checkpoint updates.
3. Ensure Tailwind class usage aligns with existing design tokens (`var(--theme-color)` etc.) used in `Teams.jsx` for consistency.

**Task 10 – Teams Page Integration**
1. Update `app/javascript/pages/Teams.jsx` to introduce nested tabs/sections (e.g., “Overview”, “Skill Matrix”, “Find Experts”, “Learning Goals”) within the selected team panel.
2. Keep the existing management UI intact; render the new components when the “Skills” tabs are active and pass required props (team id, user permissions, etc.).
3. Provide fallback states for teams without skill data (empty states mirroring the provided component designs).

**Task 11 – Routing & Access Control**
1. If dedicated routes are preferred, register nested React Router paths under `/teams/:id` in `app/javascript/components/App.jsx` and guard them with `PrivateRoute` like existing routes.
2. Optionally expose a standalone “Skill Explorer” page if a global view is needed beyond individual teams.

## QA & Release Tasks

**Task 12 – Testing & Documentation**
1. Add request specs for new APIs, model specs for validations/enums, and system specs if existing test suite covers React interactions.
2. Update seed data (if used) so developers have sample skills/goals after `rails db:seed`.
3. Document API contracts and front-end usage in the project README or a dedicated doc so future contributors understand data shapes.
4. Perform manual QA focusing on:
   * Loading matrix/search/goal tabs on desktop and mobile breakpoints.
   * Endorsement button behaviour (single click, disabled state, counts updating).
   * Goal checkpoint toggles updating progress bars in real time.

Following these tasks in order will introduce the new skill management experience while aligning with the project’s existing Rails API patterns and React architecture.
