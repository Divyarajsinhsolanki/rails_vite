module Mcp
  class ToolRegistry
    SECURITY_SCHEMES = [
      {
        type: "noauth"
      }
    ].freeze

    GENERIC_OUTPUT_SCHEMA = {
      "type" => "object",
      "additionalProperties" => true
    }.freeze

    class << self
      def instructions
        "This MCP server operates a Rails/Vite workspace app. Prefer read tools before write tools. " \
          "All records are scoped to the authenticated user's workspace. Do not ask for passwords, API keys, " \
          "Keka credentials, raw PDF bytes, or encrypted secrets. Preview repository edits with repo_patch_preview before repo_apply_patch; " \
          "if a valid unified diff is difficult, call repo_read_file and then repo_write_file with expected_sha256. " \
          "Use run_tests, repo_diff, and repo_commit for code workflows when enabled. Use db_query only for read-only SQL, " \
          "and use rails_runner or rails_console only when explicitly enabled for admin runtime work. " \
          "Apply Workspace Autopilot actions only after the user approves action IDs."
      end

      def tools
        @tools ||= [
          tool(
            "app_snapshot",
            "App Snapshot",
            "Summarize the current user's workspace, open work, upcoming events, unread notifications, and data counts.",
            object_schema,
            read_only: true
          ),
          tool(
            "daily_workspace_briefing",
            "Daily Workspace Briefing",
            "Produce an action-oriented briefing from tasks, issues, calendar, work logs, learning nudges, and notifications.",
            object_schema(properties: {
              "days_ahead" => integer("How many future days to inspect.", default: 7, minimum: 1, maximum: 30)
            }),
            read_only: true
          ),
          tool(
            "api_catalog",
            "API Catalog",
            "List Rails API routes exposed by the app, grouped by controller, so ChatGPT can understand every API section.",
            object_schema(properties: {
              "path_prefix" => string("Only include routes under this path prefix.", default: "/api"),
              "limit" => integer("Maximum number of routes to return.", default: 200, minimum: 1, maximum: 500)
            }),
            read_only: true
          ),
          tool(
            "mcp_capability_matrix",
            "MCP Capability Matrix",
            "Map every Rails route group to curated MCP tools or an explicit exclusion reason.",
            object_schema(properties: {
              "include_routes" => boolean("Include route examples for each capability.", default: true)
            }),
            read_only: true
          ),
          tool(
            "workspace_autopilot_plan",
            "Workspace Autopilot Plan",
            "Create a read-only plan with risks, priorities, focus blocks, issue escalations, and repo-linked follow-ups.",
            object_schema(properties: {
              "days_ahead" => integer("How many future days to inspect.", default: 7, minimum: 1, maximum: 30)
            }),
            read_only: true
          ),
          tool(
            "render_workspace_autopilot",
            "Render Workspace Autopilot",
            "Render the Workspace Autopilot plan in a ChatGPT app widget.",
            object_schema(properties: {
              "days_ahead" => integer("How many future days to inspect.", default: 7, minimum: 1, maximum: 30)
            }),
            read_only: true,
            widget_uri: "ui://widget/workspace_autopilot.html"
          ),
          tool(
            "workspace_autopilot_apply",
            "Apply Workspace Autopilot Actions",
            "Apply only explicitly approved Workspace Autopilot action IDs and write an MCP audit log.",
            object_schema(properties: {
              "action_ids" => array("Approved action IDs from workspace_autopilot_plan.", items: { "type" => "string" }),
              "days_ahead" => integer("Planning window used to recompute eligible actions.", default: 7, minimum: 1, maximum: 30)
            }, required: ["action_ids"]),
            destructive: true
          ),
          tool(
            "search_everything",
            "Search Everything",
            "Search projects, tasks, issues, users, posts, and saved knowledge in the authenticated workspace.",
            object_schema(
              properties: {
                "q" => string("Search query. Use at least two characters."),
                "types" => array("Optional subset of: projects, tasks, issues, users, posts, knowledge.", items: { "type" => "string" }),
                "limit" => integer("Maximum total results.", default: 30, minimum: 1, maximum: 60)
              },
              required: ["q"]
            ),
            read_only: true
          ),
          tool(
            "list_people",
            "List People",
            "List workspace users with role, availability, department, and contact-safe profile details.",
            object_schema(properties: {
              "q" => string("Optional name, email, title, or department search."),
              "limit" => integer("Maximum users.", default: 50, minimum: 1, maximum: 100)
            }),
            read_only: true
          ),
          tool(
            "list_posts",
            "List Posts",
            "List workspace posts with safe comment and like metadata.",
            object_schema(properties: {
              "q" => string("Optional post message search."),
              "limit" => integer("Maximum posts.", default: 30, minimum: 1, maximum: 100)
            }),
            read_only: true
          ),
          tool(
            "create_post",
            "Create Post",
            "Create a text post in the workspace feed.",
            object_schema(properties: {
              "message" => string("Post message.")
            }, required: ["message"]),
            destructive: false
          ),
          tool(
            "create_comment",
            "Create Comment",
            "Add a comment to a visible workspace post.",
            object_schema(properties: {
              "post_id" => integer("Post ID."),
              "body" => string("Comment body.")
            }, required: %w[post_id body]),
            destructive: false
          ),
          tool(
            "like_post",
            "Like Post",
            "Like or unlike a visible workspace post.",
            object_schema(properties: {
              "post_id" => integer("Post ID."),
              "liked" => boolean("true to like, false to unlike.", default: true)
            }, required: ["post_id"]),
            destructive: false
          ),
          tool(
            "list_departments",
            "List Departments",
            "List departments, managers, and member counts.",
            object_schema(properties: {
              "limit" => integer("Maximum departments.", default: 50, minimum: 1, maximum: 100)
            }),
            read_only: true
          ),
          tool(
            "list_projects",
            "List Projects",
            "List projects with status, dates, member counts, task counts, issue counts, and QA flags.",
            object_schema(properties: {
              "status" => string("Optional status filter: upcoming, running, completed."),
              "limit" => integer("Maximum projects.", default: 50, minimum: 1, maximum: 100)
            }),
            read_only: true
          ),
          tool(
            "list_project_members",
            "List Project Members",
            "List project memberships, roles, allocation, and workload status.",
            object_schema(properties: {
              "project_id" => integer("Optional project ID."),
              "limit" => integer("Maximum memberships.", default: 80, minimum: 1, maximum: 150)
            }),
            read_only: true
          ),
          tool(
            "add_project_member",
            "Add Project Member",
            "Add a workspace user to a project.",
            object_schema(properties: project_member_properties, required: %w[project_id user_id]),
            destructive: false
          ),
          tool(
            "update_project_member",
            "Update Project Member",
            "Update project membership role, status, allocation, or workload.",
            object_schema(properties: project_member_properties.merge("id" => integer("Project membership ID.")), required: ["id"]),
            destructive: false
          ),
          tool(
            "list_project_environments",
            "List Project Environments",
            "List project environments and safe vault counts.",
            object_schema(properties: {
              "project_id" => integer("Optional project ID."),
              "limit" => integer("Maximum environments.", default: 80, minimum: 1, maximum: 150)
            }),
            read_only: true
          ),
          tool(
            "create_project_environment",
            "Create Project Environment",
            "Create a project environment record without exposing secrets.",
            object_schema(properties: project_environment_properties, required: %w[project_id name]),
            destructive: false
          ),
          tool(
            "list_project_vault_items",
            "List Project Vault Metadata",
            "List safe project vault metadata only. Secret content and raw credentials are never returned.",
            object_schema(properties: {
              "project_id" => integer("Optional project ID."),
              "category" => string("Optional vault category."),
              "limit" => integer("Maximum vault items.", default: 80, minimum: 1, maximum: 150)
            }),
            read_only: true
          ),
          tool(
            "get_project",
            "Get Project",
            "Get one project with members, sprints, tasks, issues, environments, vault item metadata, and calendar counts.",
            object_schema(properties: {
              "project_id" => integer("Project ID.")
            }, required: ["project_id"]),
            read_only: true
          ),
          tool(
            "create_project",
            "Create Project",
            "Create a project. Requires a token with app:write and a user role allowed to manage projects.",
            object_schema(properties: project_properties, required: ["name"]),
            destructive: false
          ),
          tool(
            "update_project",
            "Update Project",
            "Update project fields. Requires a token with app:write and a user role allowed to manage projects.",
            object_schema(properties: project_properties.merge("project_id" => integer("Project ID.")), required: ["project_id"]),
            destructive: false
          ),
          tool(
            "list_task_logs",
            "List Task Logs",
            "List developer task log entries by task, developer, project, and date range.",
            object_schema(properties: {
              "task_id" => integer("Optional task ID."),
              "developer_id" => integer("Optional developer user ID."),
              "project_id" => integer("Optional project ID."),
              "start_date" => string("Inclusive date. Defaults to 30 days ago."),
              "end_date" => string("Inclusive date. Defaults to today."),
              "limit" => integer("Maximum task logs.", default: 80, minimum: 1, maximum: 150)
            }),
            read_only: true
          ),
          tool(
            "create_task_log",
            "Create Task Log",
            "Create a task log entry for a workspace task and user.",
            object_schema(properties: task_log_properties, required: %w[task_id developer_id log_date hours_logged]),
            destructive: false
          ),
          tool(
            "list_sprints",
            "List Sprints",
            "List sprints by project, status, and date.",
            object_schema(properties: {
              "project_id" => integer("Optional project ID."),
              "status" => string("Optional sprint status."),
              "limit" => integer("Maximum sprints.", default: 50, minimum: 1, maximum: 100)
            }),
            read_only: true
          ),
          tool(
            "create_sprint",
            "Create Sprint",
            "Create a sprint for a project.",
            object_schema(properties: sprint_properties, required: %w[project_id name start_date end_date]),
            destructive: false
          ),
          tool(
            "update_sprint",
            "Update Sprint",
            "Update a sprint.",
            object_schema(properties: sprint_properties.merge("sprint_id" => integer("Sprint ID.")), required: ["sprint_id"]),
            destructive: false
          ),
          tool(
            "export_sprint_tasks",
            "Export Sprint Tasks",
            "Export a sprint's tasks to its configured Google Sheet using the existing TaskSheetService flow.",
            object_schema(properties: {
              "sprint_id" => integer("Sprint ID.")
            }, required: ["sprint_id"]),
            destructive: false
          ),
          tool(
            "list_tasks",
            "List Tasks",
            "List tasks with project, sprint, assignee, developer, dates, status, QA, and estimate details.",
            object_schema(properties: {
              "project_id" => integer("Optional project ID."),
              "sprint_id" => integer("Optional sprint ID."),
              "assigned_to_user" => integer("Optional assigned user ID."),
              "status" => string("Optional status."),
              "type" => string("Optional task type."),
              "limit" => integer("Maximum tasks.", default: 50, minimum: 1, maximum: 100)
            }),
            read_only: true
          ),
          tool(
            "create_task",
            "Create Task",
            "Create a task or QA/general work item.",
            object_schema(properties: task_properties, required: ["title"]),
            destructive: false
          ),
          tool(
            "update_task",
            "Update Task",
            "Update task status, assignment, dates, estimates, QA fields, or details.",
            object_schema(properties: task_properties.merge("id" => integer("Task record ID.")), required: ["id"]),
            destructive: false
          ),
          tool(
            "list_issues",
            "List Issues",
            "List QA issues with project, assignee, severity, status, due date, and reproduction details.",
            object_schema(properties: {
              "project_id" => integer("Optional project ID."),
              "status" => string("Optional issue status."),
              "severity" => string("Optional severity."),
              "assignee_user_id" => integer("Optional assigned user ID."),
              "limit" => integer("Maximum issues.", default: 50, minimum: 1, maximum: 100)
            }),
            read_only: true
          ),
          tool(
            "create_issue",
            "Create Issue",
            "Create a QA issue for a project.",
            object_schema(properties: issue_properties, required: %w[project_id title]),
            destructive: false
          ),
          tool(
            "update_issue",
            "Update Issue",
            "Update a QA issue.",
            object_schema(properties: issue_properties.merge("id" => integer("Issue ID.")), required: ["id"]),
            destructive: false
          ),
          tool(
            "list_calendar_events",
            "List Calendar Events",
            "List personal and visible project calendar events in a date range.",
            object_schema(properties: {
              "start_date" => string("Inclusive date or datetime. Defaults to today."),
              "end_date" => string("Exclusive date or datetime. Defaults to 14 days from now."),
              "project_id" => integer("Optional project ID."),
              "limit" => integer("Maximum events.", default: 80, minimum: 1, maximum: 150)
            }),
            read_only: true
          ),
          tool(
            "create_calendar_event",
            "Create Calendar Event",
            "Create a personal or project calendar event.",
            object_schema(properties: calendar_event_properties, required: %w[title start_at end_at]),
            destructive: false
          ),
          tool(
            "update_calendar_event",
            "Update Calendar Event",
            "Update calendar event details or status.",
            object_schema(properties: calendar_event_properties.merge("id" => integer("Calendar event ID.")), required: ["id"]),
            destructive: false
          ),
          tool(
            "daily_momentum",
            "Daily Momentum",
            "Summarize today's focus tasks, triage, meetings, rapid logging hints, learning nudge, and reflection.",
            object_schema,
            read_only: true
          ),
          tool(
            "list_work_logs",
            "List Work Logs",
            "List work logs by user, date range, category, or priority.",
            object_schema(properties: {
              "user_id" => integer("Optional user ID. Defaults to current user."),
              "start_date" => string("Inclusive date. Defaults to 30 days ago."),
              "end_date" => string("Inclusive date. Defaults to today."),
              "limit" => integer("Maximum work logs.", default: 80, minimum: 1, maximum: 150)
            }),
            read_only: true
          ),
          tool(
            "create_work_log",
            "Create Work Log",
            "Create a work log entry for the current user or another workspace user.",
            object_schema(properties: work_log_properties, required: %w[title log_date start_time end_time]),
            destructive: false
          ),
          tool(
            "update_work_log",
            "Update Work Log",
            "Update a work log entry.",
            object_schema(properties: work_log_properties.merge("id" => integer("Work log ID.")), required: ["id"]),
            destructive: false
          ),
          tool(
            "list_work_taxonomy",
            "List Work Taxonomy",
            "List work categories, priorities, and tags.",
            object_schema(properties: {
              "type" => string("Optional type: category, priority, or tag."),
              "limit" => integer("Maximum records per type.", default: 80, minimum: 1, maximum: 150)
            }),
            read_only: true
          ),
          tool(
            "create_work_taxonomy_item",
            "Create Work Taxonomy Item",
            "Create a work category, priority, or tag.",
            object_schema(properties: work_taxonomy_properties, required: %w[type name]),
            destructive: false
          ),
          tool(
            "update_work_taxonomy_item",
            "Update Work Taxonomy Item",
            "Update a work category, priority, or tag.",
            object_schema(properties: work_taxonomy_properties.merge("id" => integer("Taxonomy record ID.")), required: %w[type id]),
            destructive: false
          ),
          tool(
            "list_work_notes",
            "List Work Notes",
            "List daily work notes by user and date range.",
            object_schema(properties: {
              "user_id" => integer("Optional user ID. Defaults to current user."),
              "start_date" => string("Inclusive date. Defaults to 30 days ago."),
              "end_date" => string("Inclusive date. Defaults to today."),
              "limit" => integer("Maximum notes.", default: 80, minimum: 1, maximum: 150)
            }),
            read_only: true
          ),
          tool(
            "create_work_note",
            "Create Work Note",
            "Create or replace a daily work note.",
            object_schema(properties: work_note_properties, required: %w[note_date content]),
            destructive: false
          ),
          tool(
            "update_work_note",
            "Update Work Note",
            "Update a daily work note.",
            object_schema(properties: work_note_properties.merge("id" => integer("Work note ID.")), required: ["id"]),
            destructive: false
          ),
          tool(
            "list_teams",
            "List Teams",
            "List teams with owners, members, learning goals, and skills coverage.",
            object_schema(properties: {
              "limit" => integer("Maximum teams.", default: 50, minimum: 1, maximum: 100)
            }),
            read_only: true
          ),
          tool(
            "list_skills",
            "List Skills",
            "List workspace skills and user proficiency coverage.",
            object_schema(properties: {
              "q" => string("Optional skill search."),
              "limit" => integer("Maximum skills.", default: 80, minimum: 1, maximum: 150)
            }),
            read_only: true
          ),
          tool(
            "list_learning_goals",
            "List Learning Goals",
            "List learning goals, checkpoints, progress, owners, and due dates.",
            object_schema(properties: {
              "user_id" => integer("Optional user ID."),
              "team_id" => integer("Optional team ID."),
              "limit" => integer("Maximum goals.", default: 50, minimum: 1, maximum: 100)
            }),
            read_only: true
          ),
          tool(
            "portfolio_snapshot",
            "Portfolio Snapshot",
            "Read published portfolio profile and projects.",
            object_schema,
            read_only: true
          ),
          tool(
            "list_knowledge_bookmarks",
            "List Knowledge Bookmarks",
            "List saved learning or knowledge cards for the current user.",
            object_schema(properties: {
              "due_only" => boolean("Only return bookmarks due for review.", default: false),
              "limit" => integer("Maximum bookmarks.", default: 50, minimum: 1, maximum: 100)
            }),
            read_only: true
          ),
          tool(
            "create_knowledge_bookmark",
            "Create Knowledge Bookmark",
            "Save a knowledge card with a review reminder.",
            object_schema(properties: {
              "card_type" => string("Card type, for example article, snippet, idea, question."),
              "collection_name" => string("Optional collection name."),
              "source_id" => string("Optional source identifier."),
              "payload" => {
                "type" => "object",
                "description" => "JSON payload containing title, summary, URL, prompt, answer, or other safe card fields.",
                "additionalProperties" => true
              },
              "reminder_interval_days" => integer("Review interval in days.", default: 7, minimum: 1, maximum: 365)
            }, required: %w[card_type payload]),
            destructive: false
          ),
          tool(
            "list_knowledge_items",
            "List Generated Knowledge Items",
            "List ChatGPT/MCP-generated knowledge cards for the current user.",
            object_schema(properties: {
              "active" => boolean("Only active cards when true, archived cards when false."),
              "category" => string("Optional category filter."),
              "collection_name" => string("Optional collection name."),
              "limit" => integer("Maximum items.", default: 50, minimum: 1, maximum: 100)
            }),
            read_only: true
          ),
          tool(
            "create_knowledge_items",
            "Create Generated Knowledge Items",
            "Create a prompt history run and one or more generated knowledge cards.",
            object_schema(properties: {
              "prompt" => string("The user's original ChatGPT prompt or request."),
              "mode" => string("history, replace_topic, or replace_all.", default: "history"),
              "source" => string("Source label for this generation.", default: "mcp"),
              "collection_name" => string("Optional collection name applied to cards without their own collection."),
              "metadata" => {
                "type" => "object",
                "description" => "Optional run metadata.",
                "additionalProperties" => true
              },
              "items" => array(
                "Knowledge cards to create.",
                items: {
                  "type" => "object",
                  "properties" => {
                    "title" => { "type" => "string" },
                    "summary" => { "type" => "string" },
                    "body" => { "type" => "string" },
                    "category" => { "type" => "string" },
                    "item_type" => { "type" => "string" },
                    "collection_name" => { "type" => "string" },
                    "source_name" => { "type" => "string" },
                    "source_url" => { "type" => "string" },
                    "source_key" => { "type" => "string" },
                    "published_at" => { "type" => "string" },
                    "tags" => { "type" => "array", "items" => { "type" => "string" } },
                    "payload" => { "type" => "object", "additionalProperties" => true }
                  },
                  "required" => ["title"],
                  "additionalProperties" => true
                }
              )
            }, required: %w[prompt items]),
            destructive: false
          ),
          tool(
            "list_conversations",
            "List Conversations",
            "List conversations visible to the current user, including participants and latest message preview.",
            object_schema(properties: {
              "limit" => integer("Maximum conversations.", default: 30, minimum: 1, maximum: 100)
            }),
            read_only: true
          ),
          tool(
            "send_chat_message",
            "Send Chat Message",
            "Send a chat message in an existing conversation visible to the current user.",
            object_schema(properties: {
              "conversation_id" => integer("Conversation ID."),
              "body" => string("Message body.")
            }, required: %w[conversation_id body]),
            destructive: true
          ),
          tool(
            "list_notifications",
            "List Notifications",
            "List current user's notifications.",
            object_schema(properties: {
              "unread_only" => boolean("Only unread notifications.", default: false),
              "limit" => integer("Maximum notifications.", default: 50, minimum: 1, maximum: 100)
            }),
            read_only: true
          ),
          tool(
            "mark_notification_read",
            "Mark Notification Read",
            "Mark a notification as read.",
            object_schema(properties: {
              "id" => integer("Notification ID.")
            }, required: ["id"]),
            destructive: false
          ),
          tool(
            "list_pdf_documents",
            "List PDF Documents",
            "List PDF document metadata, versions, operations, page counts, and storage usage. Raw file bytes are not exposed.",
            object_schema(properties: {
              "limit" => integer("Maximum documents.", default: 50, minimum: 1, maximum: 100)
            }),
            read_only: true
          ),
          tool(
            "get_pdf_document_text",
            "Get PDF Document Text",
            "Extract UTF-8 text from a PDF document owned by the current user. Raw PDF bytes are never returned.",
            object_schema(properties: {
              "id" => integer("PDF document ID."),
              "max_chars" => integer("Maximum characters to return.", default: 12000, minimum: 100, maximum: 50000)
            }, required: ["id"]),
            read_only: true
          ),
          tool(
            "list_pdf_operations",
            "List PDF Operations",
            "List PDF operation metadata and status for the current user.",
            object_schema(properties: {
              "pdf_document_id" => integer("Optional PDF document ID."),
              "status" => string("Optional operation status."),
              "limit" => integer("Maximum operations.", default: 50, minimum: 1, maximum: 100)
            }),
            read_only: true
          ),
          tool(
            "keka_profile_summary",
            "Keka Profile Summary",
            "Read safe Keka profile sync metadata and non-secret profile summary for the current user.",
            object_schema,
            read_only: true
          ),
          tool(
            "repo_status",
            "Repository Status",
            "Show git status and whether repository write tools are enabled.",
            object_schema,
            read_only: true
          ),
          tool(
            "repo_diff",
            "Repository Diff",
            "Return git diff and stat output for selected safe paths, or the whole repo if no paths are provided.",
            object_schema(properties: {
              "paths" => array("Optional relative file paths to diff.", items: { "type" => "string" }),
              "staged" => boolean("Show staged diff instead of working tree diff.", default: false),
              "max_bytes" => integer("Maximum diff bytes to return.", default: 80000, minimum: 1, maximum: 200000)
            }),
            read_only: true
          ),
          tool(
            "repo_search",
            "Repository Search",
            "Search source files in this Rails/Vite repo using ripgrep. Secrets and generated folders are excluded.",
            object_schema(properties: {
              "query" => string("Search text or regex for ripgrep."),
              "path" => string("Optional relative directory or file path."),
              "limit" => integer("Maximum matches.", default: 50, minimum: 1, maximum: 200)
            }, required: ["query"]),
            read_only: true
          ),
          tool(
            "repo_read_file",
            "Repository Read File",
            "Read a text file from this repository and return its SHA-256 for guarded writes. Secret and generated paths are blocked.",
            object_schema(properties: {
              "path" => string("Relative file path."),
              "max_bytes" => integer("Maximum bytes to read.", default: 80000, minimum: 1, maximum: 200000)
            }, required: ["path"]),
            read_only: true
          ),
          tool(
            "repo_write_file",
            "Repository Write File",
            "Write a complete UTF-8 text file. Existing files require expected_sha256 from repo_read_file. Disabled unless MCP_ENABLE_CODE_TOOLS=true and token has repo:write.",
            object_schema(properties: {
              "path" => string("Relative file path."),
              "content" => string("Complete replacement file content."),
              "expected_sha256" => string("Required for existing files. Use the sha256 returned by repo_read_file.")
            }, required: %w[path content]),
            destructive: true
          ),
          tool(
            "repo_commit",
            "Repository Commit",
            "Stage selected safe paths and create a git commit. Disabled unless MCP_ENABLE_CODE_TOOLS=true and token has repo:write.",
            object_schema(properties: {
              "message" => string("Commit message."),
              "paths" => array("Relative paths to include in the commit.", items: { "type" => "string" })
            }, required: %w[message paths]),
            destructive: true
          ),
          tool(
            "repo_patch_preview",
            "Repository Patch Preview",
            "Validate a valid unified git patch and report changed paths without applying it. Hunk headers must include line ranges, for example @@ -1,2 +1,3 @@.",
            object_schema(properties: {
              "patch" => string("Unified git patch.")
            }, required: ["patch"]),
            read_only: true
          ),
          tool(
            "repo_apply_patch",
            "Repository Apply Patch",
            "Apply a valid unified git patch inside this repository. Disabled unless MCP_ENABLE_CODE_TOOLS=true and token has repo:write. If generating a correct patch is difficult, use repo_write_file with expected_sha256.",
            object_schema(properties: {
              "patch" => string("Unified git patch.")
            }, required: ["patch"]),
            destructive: true
          ),
          tool(
            "run_tests",
            "Run Tests",
            "Run an allowlisted test/build command. Disabled unless MCP_ENABLE_CODE_TOOLS=true and token has repo:read.",
            object_schema(properties: {
              "target" => string("One of mcp_requests, rails_all, yarn_build, yarn_test, or rails_file.", default: "mcp_requests"),
              "path" => string("Required when target is rails_file; must be under test/."),
              "timeout_seconds" => integer("Timeout seconds.", default: 120, minimum: 1, maximum: 600),
              "max_output_bytes" => integer("Maximum stdout/stderr bytes each.", default: 80000, minimum: 1, maximum: 200000)
            }),
            destructive: false
          ),
          tool(
            "db_query",
            "Database Query",
            "Run a read-only SELECT/WITH/EXPLAIN SQL query. Requires MCP_ENABLE_DB_TOOLS=true and token scope db:read.",
            object_schema(properties: {
              "sql" => string("Read-only SQL query. Multiple statements and mutating SQL are blocked."),
              "limit" => integer("Maximum rows returned.", default: 50, minimum: 1, maximum: 500),
              "timeout_ms" => integer("Statement timeout in milliseconds.", default: 5000, minimum: 1, maximum: 30000)
            }, required: ["sql"]),
            read_only: true
          ),
          tool(
            "rails_runner",
            "Rails Runner",
            "Run noninteractive Ruby through bin/rails runner. Requires MCP_ENABLE_RAILS_RUNTIME_TOOLS=true, token scope system:admin, and confirmation RUN_RAILS_CODE.",
            object_schema(properties: {
              "code" => string("Ruby code passed to rails runner."),
              "confirmation" => string("Must equal RUN_RAILS_CODE."),
              "timeout_seconds" => integer("Timeout seconds.", default: 30, minimum: 1, maximum: 180),
              "max_output_bytes" => integer("Maximum stdout/stderr bytes each.", default: 80000, minimum: 1, maximum: 200000)
            }, required: %w[code confirmation]),
            destructive: true
          ),
          tool(
            "rails_console",
            "Rails Console",
            "Run a single noninteractive Rails console-style Ruby snippet. Requires MCP_ENABLE_RAILS_RUNTIME_TOOLS=true, token scope system:admin, and confirmation RUN_RAILS_CODE.",
            object_schema(properties: {
              "code" => string("Ruby code to evaluate in the Rails app context."),
              "confirmation" => string("Must equal RUN_RAILS_CODE."),
              "timeout_seconds" => integer("Timeout seconds.", default: 30, minimum: 1, maximum: 180),
              "max_output_bytes" => integer("Maximum stdout/stderr bytes each.", default: 80000, minimum: 1, maximum: 200000)
            }, required: %w[code confirmation]),
            destructive: true
          )
        ]
      end

      def resources
        [
          {
            uri: "ui://widget/workspace_autopilot.html",
            name: "workspace_autopilot_widget",
            title: "Workspace Autopilot",
            description: "Interactive review surface for Workspace Autopilot risks and approved actions.",
            mimeType: "text/html;profile=mcp-app",
            _meta: {
              "openai/widgetDescription": "Review Workspace Autopilot priorities, risks, and approval-ready actions.",
              "openai/widgetPrefersBorder": true,
              "openai/widgetDomain": ENV.fetch("MCP_WIDGET_DOMAIN", nil)
            }.compact
          }
        ]
      end

      def read_resource(uri)
        resource = resources.find { |item| item[:uri] == uri || item["uri"] == uri }
        return unless resource

        {
          contents: [
            resource.merge(text: workspace_autopilot_widget_html)
          ]
        }
      end

      private

      def tool(name, title, description, input_schema, read_only: false, destructive: nil, widget_uri: nil, output_schema: GENERIC_OUTPUT_SCHEMA)
        destructive = !read_only if destructive.nil?

        descriptor = {
          name: name,
          title: title,
          description: description,
          inputSchema: input_schema,
          outputSchema: output_schema,
          securitySchemes: SECURITY_SCHEMES,
          annotations: {
            readOnlyHint: read_only,
            destructiveHint: destructive,
            idempotentHint: read_only,
            openWorldHint: false
          },
          _meta: {
            securitySchemes: SECURITY_SCHEMES,
            "openai/toolInvocation/invoking": "#{title} running",
            "openai/toolInvocation/invoked": "#{title} complete"
          }
        }
        descriptor[:_meta]["openai/outputTemplate"] = widget_uri if widget_uri
        descriptor
      end

      def object_schema(properties: {}, required: [], description: nil)
        schema = {
          "type" => "object",
          "properties" => properties,
          "required" => required,
          "additionalProperties" => false
        }
        schema["description"] = description if description
        schema
      end

      def string(description, default: nil)
        schema = { "type" => "string", "description" => description }
        schema["default"] = default unless default.nil?
        schema
      end

      def integer(description, default: nil, minimum: nil, maximum: nil)
        schema = { "type" => "integer", "description" => description }
        schema["default"] = default unless default.nil?
        schema["minimum"] = minimum unless minimum.nil?
        schema["maximum"] = maximum unless maximum.nil?
        schema
      end

      def boolean(description, default: nil)
        schema = { "type" => "boolean", "description" => description }
        schema["default"] = default unless default.nil?
        schema
      end

      def array(description, items:)
        {
          "type" => "array",
          "description" => description,
          "items" => items
        }
      end

      def project_properties
        {
          "name" => string("Project name."),
          "description" => string("Project description."),
          "start_date" => string("Start date, YYYY-MM-DD."),
          "end_date" => string("End date, YYYY-MM-DD."),
          "qa_mode_enabled" => boolean("Enable QA issue tracking mode.")
        }
      end

      def sprint_properties
        {
          "project_id" => integer("Project ID."),
          "name" => string("Sprint name."),
          "start_date" => string("Start date, YYYY-MM-DD."),
          "end_date" => string("End date, YYYY-MM-DD."),
          "status" => string("Sprint status."),
          "progress" => integer("Progress percentage.", minimum: 0, maximum: 100)
        }
      end

      def task_properties
        {
          "task_id" => string("External task key, for example JIRA-123. Required for non-general tasks."),
          "task_url" => string("External task URL."),
          "type" => string("Task type. Use general for personal tasks, Code for development, qa for QA."),
          "title" => string("Task title."),
          "description" => string("Task description."),
          "status" => string("Task status."),
          "priority" => string("Task priority."),
          "project_id" => integer("Optional project ID."),
          "sprint_id" => integer("Optional sprint ID."),
          "developer_id" => integer("Optional developer user ID."),
          "assigned_to_user" => integer("Optional assigned user ID."),
          "start_date" => string("Start date, YYYY-MM-DD."),
          "end_date" => string("End date, YYYY-MM-DD."),
          "estimated_hours" => integer("Estimated hours."),
          "qa_assigned" => string("QA assignment label."),
          "internal_qa" => string("Internal QA status."),
          "blocker" => boolean("Whether task is blocking."),
          "demo" => boolean("Whether task is demo-related.")
        }
      end

      def issue_properties
        {
          "project_id" => integer("Project ID."),
          "issue_key" => string("Optional issue key. Generated when omitted."),
          "title" => string("Issue title."),
          "status" => string("Issue status."),
          "severity" => string("Issue severity: Low, Medium, High, Critical."),
          "category" => string("Issue category."),
          "module_name" => string("Module name."),
          "sub_module" => string("Sub-module name."),
          "issue_description" => string("Issue description."),
          "pre_conditions" => string("Pre-conditions."),
          "repro_steps" => string("Steps to reproduce."),
          "actual_result" => string("Actual result."),
          "expected_result" => string("Expected result."),
          "comment" => string("General comment."),
          "assignee_user_id" => integer("Assigned user ID."),
          "reporter_id" => integer("Reporter user ID."),
          "due_date" => string("Due date, YYYY-MM-DD.")
        }
      end

      def calendar_event_properties
        {
          "title" => string("Event title."),
          "description" => string("Event description."),
          "start_at" => string("Start datetime."),
          "end_at" => string("End datetime."),
          "all_day" => boolean("All-day event."),
          "event_type" => string("meeting, deadline, reminder, focus, or sprint_ceremony."),
          "visibility" => string("personal or project."),
          "status" => string("scheduled, cancelled, or completed."),
          "location_or_meet_link" => string("Location or meeting URL."),
          "project_id" => integer("Optional project ID."),
          "task_id" => integer("Optional task ID."),
          "sprint_id" => integer("Optional sprint ID."),
          "recurrence_rule" => string("none, daily, weekly, or monthly.")
        }
      end

      def work_log_properties
        {
          "user_id" => integer("User ID. Defaults to current user."),
          "title" => string("Work log title."),
          "description" => string("Work log notes."),
          "log_date" => string("Date, YYYY-MM-DD."),
          "start_time" => string("Start time, HH:MM."),
          "end_time" => string("End time, HH:MM."),
          "category_id" => integer("Optional work category ID."),
          "priority_id" => integer("Optional work priority ID."),
          "actual_minutes" => integer("Actual minutes.")
        }
      end

      def project_member_properties
        {
          "project_id" => integer("Project ID."),
          "user_id" => integer("Workspace user ID."),
          "role" => string("Project role, for example owner, manager, collaborator, developer, qa, viewer."),
          "status" => string("Membership status, for example active, invited, requested, removed."),
          "allocation_percentage" => integer("Allocation percentage.", minimum: 0, maximum: 100),
          "workload_status" => string("free, partial, full, or overloaded.")
        }
      end

      def project_environment_properties
        {
          "project_id" => integer("Project ID."),
          "name" => string("Environment name."),
          "url" => string("Safe environment URL."),
          "description" => string("Environment description.")
        }
      end

      def task_log_properties
        {
          "task_id" => integer("Task record ID."),
          "developer_id" => integer("Developer user ID."),
          "log_date" => string("Date, YYYY-MM-DD."),
          "hours_logged" => integer("Hours logged."),
          "type" => string("Log type, for example Code or QA."),
          "status" => string("Log status.")
        }
      end

      def work_taxonomy_properties
        {
          "type" => string("category, priority, or tag."),
          "name" => string("Display name."),
          "color" => string("Optional color label for category or priority."),
          "hex" => string("Optional hex color for category or priority.")
        }
      end

      def work_note_properties
        {
          "user_id" => integer("User ID. Defaults to current user."),
          "note_date" => string("Date, YYYY-MM-DD."),
          "content" => string("Daily note content.")
        }
      end

      def workspace_autopilot_widget_html
        <<~HTML
          <!doctype html>
          <html lang="en">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <style>
                :root { color-scheme: light dark; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
                body { margin: 0; padding: 16px; background: #f8fafc; color: #0f172a; }
                .wrap { display: grid; gap: 12px; }
                .top { display: flex; justify-content: space-between; gap: 12px; align-items: center; }
                h1 { font-size: 18px; line-height: 1.2; margin: 0; }
                .muted { color: #64748b; font-size: 12px; }
                .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px; }
                .panel { border: 1px solid #dbe3ef; border-radius: 8px; background: #fff; padding: 12px; min-width: 0; }
                .panel h2 { font-size: 13px; margin: 0 0 8px; color: #334155; }
                .item { border-top: 1px solid #e2e8f0; padding: 8px 0; font-size: 13px; }
                .item:first-of-type { border-top: 0; }
                .badge { display: inline-flex; align-items: center; border: 1px solid #cbd5e1; border-radius: 999px; padding: 2px 7px; font-size: 11px; margin-right: 6px; color: #334155; }
                code { font-size: 11px; white-space: normal; overflow-wrap: anywhere; }
                @media (prefers-color-scheme: dark) {
                  body { background: #0f172a; color: #e2e8f0; }
                  .panel { background: #111827; border-color: #334155; }
                  .muted { color: #94a3b8; }
                  .panel h2 { color: #cbd5e1; }
                  .item { border-color: #334155; }
                  .badge { border-color: #475569; color: #cbd5e1; }
                }
              </style>
            </head>
            <body>
              <main class="wrap">
                <div class="top">
                  <h1>Workspace Autopilot</h1>
                  <span class="muted" id="generated">Waiting for tool output</span>
                </div>
                <section class="grid">
                  <div class="panel"><h2>Priorities</h2><div id="priorities"></div></div>
                  <div class="panel"><h2>Risks</h2><div id="risks"></div></div>
                  <div class="panel"><h2>Approval Actions</h2><div id="actions"></div></div>
                </section>
              </main>
              <script>
                const pick = () => window.openai?.toolOutput || window.openai?.structuredContent || {};
                const root = pick();
                const plan = root.plan || root;
                const renderList = (id, values, renderer) => {
                  const node = document.getElementById(id);
                  const items = Array.isArray(values) && values.length ? values : [{ title: "Nothing pending", description: "No items in this section." }];
                  node.innerHTML = items.map(renderer).join("");
                };
                document.getElementById("generated").textContent = plan.generated_at ? `Generated ${new Date(plan.generated_at).toLocaleString()}` : "Generated by MCP";
                renderList("priorities", plan.priorities, item => `<div class="item"><span class="badge">${item.kind || item.type || "priority"}</span>${item.recommendation || item.title || ""}<div class="muted">${item.count ?? ""}</div></div>`);
                renderList("risks", plan.risks, item => `<div class="item"><strong>${item.title || item.kind || "Risk"}</strong><div class="muted">${item.description || ""}</div></div>`);
                renderList("actions", plan.actions, item => `<div class="item"><code>${item.id || "action"}</code><div>${item.title || item.description || ""}</div><div class="muted">${item.requires_approval === false ? "Auto-safe" : "Requires approval"}</div></div>`);
              </script>
            </body>
          </html>
        HTML
      end
    end
  end
end
