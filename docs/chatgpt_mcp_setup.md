# ChatGPT MCP Setup

This app now exposes a Rails-native MCP endpoint at `/mcp`. ChatGPT can connect to it as a developer-mode connector and call curated tools for projects, tasks, sprints, issues, calendar, work logs, posts, comments, likes, teams, skills, learning goals, knowledge bookmarks, chat, notifications, PDF metadata/text, portfolio, Keka profile summary, API coverage, Workspace Autopilot, and local repository inspection.

Sources used for the ChatGPT-side flow:

- OpenAI Apps SDK, Connect from ChatGPT: https://developers.openai.com/apps-sdk/deploy/connect-chatgpt
- OpenAI Secure MCP Tunnel guide: https://developers.openai.com/api/docs/guides/secure-mcp-tunnels
- OpenAI Apps SDK, Build your MCP server: https://developers.openai.com/apps-sdk/build/mcp-server
- OpenAI Apps SDK, ChatGPT UI: https://developers.openai.com/apps-sdk/build/chatgpt-ui

The MCP descriptors include `outputSchema`, bearer `securitySchemes`, mirrored `_meta.securitySchemes`, invocation status text, accurate read/destructive annotations, and `openai/outputTemplate` for the Workspace Autopilot widget. The endpoint also supports `resources/list` and `resources/read` for `ui://widget/workspace_autopilot.html`.

## 1. Run the database migration

```bash
bin/rails db:migrate
```

## 2. Create a token for ChatGPT

Use a real user from the workspace you want ChatGPT to access.

```bash
bin/rails mcp:token EMAIL=you@example.com NAME=chatgpt
```

Default scopes are:

- `app:read`
- `app:write`
- `repo:read`

For local code edits through ChatGPT, create a token with `repo:write` too:

```bash
bin/rails mcp:token EMAIL=you@example.com NAME=chatgpt-local-code SCOPES=app:read,app:write,repo:read,repo:write
```

Keep the printed token private. Only a digest is stored, so the raw token cannot be recovered later.

## 3. Start the app locally

```bash
bin/dev
```

The local MCP endpoint is:

```text
http://localhost:3000/mcp
```

For local developer testing from ChatGPT web, the endpoint can accept a query token in development:

```text
http://localhost:3000/mcp?mcp_token=rv_mcp_...
```

In production, query-token auth is disabled by default. Production clients should send:

```http
Authorization: Bearer rv_mcp_...
```

Before publishing this as a public ChatGPT app, replace the developer token flow with OAuth.

## 4. Expose local MCP to ChatGPT

ChatGPT needs a reachable HTTPS endpoint.

Option A: Secure MCP Tunnel

1. Create a tunnel in Platform tunnel settings.
2. Run `tunnel-client` on the machine that can reach this Rails app.
3. Configure it to forward to `http://localhost:3000/mcp?mcp_token=rv_mcp_...`.
4. In ChatGPT connector setup, choose `Tunnel` and select the tunnel.

Option B: ngrok or Cloudflare Tunnel

```bash
ngrok http 3000
```

Use this connector URL:

```text
https://YOUR-TUNNEL.ngrok.app/mcp?mcp_token=rv_mcp_...
```

## 5. ChatGPT website steps

OpenAI's current connector flow is:

1. In ChatGPT, open `Settings -> Apps & Connectors -> Advanced settings`.
2. Turn on developer mode if your account or workspace allows it.
3. Go to `Settings -> Connectors -> Create`.
4. Enter connector metadata:
   - Connector name: `Rails Vite Workspace`
   - Description: `Access projects, tasks, sprints, QA issues, calendar, teams, skills, knowledge, chat, notifications, PDF metadata, and repo context from my Rails/Vite app.`
   - Connector URL: your public `/mcp` URL.
5. Click `Create`.
6. If the tool list appears, open a new chat.
7. Click the `+` button near the composer, choose `More`, and select this connector.
8. Try prompts like:

```text
Give me my daily workspace briefing.
```

```text
List my running projects and overdue tasks.
```

```text
Search my app for Orion issues and tasks.
```

```text
Inspect this repo and tell me where task status is handled.
```

## 6. Local repo coding through ChatGPT

Read-only repo tools are available by default:

- `repo_status`
- `repo_search`
- `repo_read_file`

Patch writes require both:

- Token scope: `repo:write`
- Environment variable: `MCP_ENABLE_CODE_TOOLS=true`

Run locally:

```bash
MCP_ENABLE_CODE_TOOLS=true bin/dev
```

ChatGPT should call `repo_patch_preview` before `repo_apply_patch`. If ChatGPT cannot produce a valid unified diff, it can use `repo_read_file` followed by `repo_write_file` with the returned `sha256` as `expected_sha256`. The server blocks secret paths such as `.env`, Rails credentials, private keys, logs, storage, build output, and dependency folders.

Additional local code tools:

- `repo_diff`: requires `repo:read`.
- `run_tests`: requires `repo:read` and `MCP_ENABLE_CODE_TOOLS=true`.
- `repo_commit`: requires `repo:write` and `MCP_ENABLE_CODE_TOOLS=true`.
- `db_query`: read-only SQL only; requires token scope `db:read` and `MCP_ENABLE_DB_TOOLS=true`.
- `rails_runner` / `rails_console`: noninteractive Ruby execution only; requires token scope `system:admin`, `MCP_ENABLE_RAILS_RUNTIME_TOOLS=true`, and confirmation `RUN_RAILS_CODE`.

For full local operator mode, create a separate short-lived token:

```bash
bin/rails mcp:token EMAIL=you@example.com NAME=chatgpt-local-operator SCOPES=app:read,app:write,repo:read,repo:write,db:read,system:admin EXPIRES_IN_DAYS=7
```

Run only when you are actively using it:

```bash
MCP_ENABLE_CODE_TOOLS=true MCP_ENABLE_DB_TOOLS=true MCP_ENABLE_RAILS_RUNTIME_TOOLS=true bin/dev
```

## 7. What ChatGPT Can Access

Read and summarize:

- Workspace snapshot and SaaS plan metadata
- MCP capability matrix for every Rails route group
- Rails API route catalog
- Global search
- Users and roles
- Feed posts, comments, and likes
- Departments
- Projects, project members, environments, and safe vault metadata
- Sprints and tasks
- Task logs
- QA issues
- Calendar events and reminders
- Work logs
- Work categories, priorities, tags, and notes
- Teams, skills, learning goals, and checkpoints
- Knowledge bookmarks
- Conversations and latest chat previews
- Notifications
- Published portfolio data
- Keka profile sync metadata and non-secret profile summary
- PDF document metadata, versions, operations, and extracted text
- Git status, file search, and file reads
- Patch preview

Create or update:

- Projects, if the MCP user is `owner` or `project_manager`
- Sprints
- Tasks
- QA issues
- Calendar events
- Work logs
- Knowledge bookmarks
- Chat messages
- Notification read state
- Repository patches, only when explicitly enabled locally
- Workspace Autopilot approved actions, with audit logs

Blocked by design:

- Passwords and Devise secrets
- Keka API keys and encrypted Keka fields
- Keka credential writes
- Rails credentials and `.env`
- Raw PDF bytes
- Arbitrary shell commands
- Generic database console access
- Admin destructive table mutations
- Raw generic admin CRUD and admin impersonation

## 8. New Feature Directions

The first unique feature is `Workspace Autopilot`:

- ChatGPT calls `workspace_autopilot_plan` or `render_workspace_autopilot`.
- `render_workspace_autopilot` opens the ChatGPT widget from `ui://widget/workspace_autopilot.html`.
- It proposes focus blocks, task triage moves, and issue escalations as action IDs.
- You approve action IDs.
- ChatGPT calls `workspace_autopilot_apply`.
- The app updates tasks/calendar/issues and writes `mcp_audit_logs`.

Other strong directions:

- `Living Project Memory`: timeline decisions from chat, issues, work logs, and knowledge bookmarks.
- `Quality Radar`: predict sprint risk from blocked tasks, high-severity issues, assignee load, and due dates.
- `Code-to-Work Loop`: when a repo patch lands, create the task note, QA checklist, changelog, and knowledge card automatically.
- `Skill Graph Coach`: map project risk to missing team skills and generate learning goals.

## 9. Useful Maintenance Commands

Revoke a token:

```bash
bin/rails mcp:revoke ID=123
```

Refresh connector metadata after changing tools:

1. Restart or redeploy the app.
2. In ChatGPT, open `Settings -> Connectors`.
3. Open this connector.
4. Click `Refresh`.

Route coverage check:

```text
Call mcp_capability_matrix and show me which Rails route groups are curated or excluded.
```

Repo edit safety flow:

```text
Inspect the repo, propose a patch, then call repo_patch_preview before asking me to apply it. If patch formatting fails, read the target file and call repo_write_file with expected_sha256.
```
