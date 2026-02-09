# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.1].define(version: 2027_02_01_000003) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "active_storage_attachments", force: :cascade do |t|
    t.string "name", null: false
    t.string "record_type", null: false
    t.bigint "record_id", null: false
    t.bigint "blob_id", null: false
    t.datetime "created_at", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.string "key", null: false
    t.string "filename", null: false
    t.string "content_type"
    t.text "metadata"
    t.string "service_name", null: false
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.datetime "created_at", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "comments", force: :cascade do |t|
    t.bigint "post_id", null: false
    t.bigint "user_id", null: false
    t.text "body", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["post_id", "created_at"], name: "index_comments_on_post_id_and_created_at"
    t.index ["post_id"], name: "index_comments_on_post_id"
    t.index ["user_id"], name: "index_comments_on_user_id"
  end

  create_table "contacts", force: :cascade do |t|
    t.string "name", null: false
    t.string "email", null: false
    t.text "message", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "departments", force: :cascade do |t|
    t.string "name", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_departments_on_name", unique: true
  end

  create_table "developers", force: :cascade do |t|
    t.string "name", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_developers_on_name", unique: true
  end

  create_table "friendships", force: :cascade do |t|
    t.bigint "follower_id", null: false
    t.bigint "followed_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["followed_id"], name: "index_friendships_on_followed_id"
    t.index ["follower_id", "followed_id"], name: "index_friendships_on_follower_id_and_followed_id", unique: true
    t.index ["follower_id"], name: "index_friendships_on_follower_id"
  end

  create_table "issues", force: :cascade do |t|
    t.bigint "project_id", null: false
    t.string "issue_key", null: false
    t.string "title", null: false
    t.string "status", default: "New", null: false
    t.string "severity", default: "Medium", null: false
    t.string "category"
    t.string "module_name"
    t.string "sub_module"
    t.string "sprint_name"
    t.string "task_id"
    t.string "found_by"
    t.date "found_on"
    t.text "issue_description"
    t.text "pre_conditions"
    t.text "repro_steps"
    t.text "actual_result"
    t.text "expected_result"
    t.string "attachment"
    t.text "comment"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.jsonb "media_urls", default: [], null: false
    t.jsonb "attachment_urls", default: [], null: false
    t.string "owner"
    t.string "owner_email"
    t.string "assignee"
    t.string "assignee_email"
    t.string "assignee_slack"
    t.date "due_date"
    t.string "section_detail"
    t.string "mf6_app"
    t.string "local_qa"
    t.string "team_test"
    t.text "comment_qa"
    t.text "dev_comments_dated"
    t.text "developer_comment"
    t.string "issue_present_in_rails4"
    t.bigint "reporter_id"
    t.bigint "assignee_user_id"
    t.index ["assignee"], name: "index_issues_on_assignee"
    t.index ["assignee_user_id"], name: "index_issues_on_assignee_user_id"
    t.index ["due_date"], name: "index_issues_on_due_date"
    t.index ["issue_key"], name: "index_issues_on_issue_key", unique: true
    t.index ["local_qa"], name: "index_issues_on_local_qa"
    t.index ["mf6_app"], name: "index_issues_on_mf6_app"
    t.index ["project_id"], name: "index_issues_on_project_id"
    t.index ["reporter_id"], name: "index_issues_on_reporter_id"
    t.index ["team_test"], name: "index_issues_on_team_test"
  end

  create_table "items", force: :cascade do |t|
    t.string "title", null: false
    t.string "category"
    t.text "content", null: false
    t.bigint "user_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_items_on_user_id"
  end

  create_table "knowledge_bookmarks", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "card_type", null: false
    t.string "collection_name"
    t.string "source_id"
    t.jsonb "payload", default: {}, null: false
    t.datetime "last_viewed_at"
    t.datetime "last_reminded_at"
    t.datetime "next_reminder_at"
    t.integer "reminder_interval_days", default: 7, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["collection_name"], name: "index_knowledge_bookmarks_on_collection_name"
    t.index ["next_reminder_at"], name: "index_knowledge_bookmarks_on_next_reminder_at"
    t.index ["user_id", "card_type", "source_id"], name: "index_knowledge_bookmarks_on_identity", unique: true
    t.index ["user_id"], name: "index_knowledge_bookmarks_on_user_id"
  end

  create_table "learning_checkpoints", force: :cascade do |t|
    t.bigint "learning_goal_id", null: false
    t.string "title", null: false
    t.boolean "completed", default: false, null: false
    t.string "resource_url"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["learning_goal_id"], name: "index_learning_checkpoints_on_learning_goal_id"
  end

  create_table "learning_goals", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "team_id"
    t.string "title", null: false
    t.date "due_date"
    t.integer "progress", default: 0, null: false
    t.text "description"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["team_id"], name: "index_learning_goals_on_team_id"
    t.index ["user_id"], name: "index_learning_goals_on_user_id"
  end

  create_table "notifications", force: :cascade do |t|
    t.bigint "recipient_id", null: false
    t.bigint "actor_id", null: false
    t.datetime "read_at"
    t.string "action"
    t.string "notifiable_type", null: false
    t.bigint "notifiable_id", null: false
    t.jsonb "metadata"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["actor_id"], name: "index_notifications_on_actor_id"
    t.index ["notifiable_type", "notifiable_id"], name: "index_notifications_on_notifiable"
    t.index ["recipient_id"], name: "index_notifications_on_recipient_id"
  end

  create_table "post_likes", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "post_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["post_id"], name: "index_post_likes_on_post_id"
    t.index ["user_id", "post_id"], name: "index_post_likes_on_user_id_and_post_id", unique: true
    t.index ["user_id"], name: "index_post_likes_on_user_id"
  end

  create_table "posts", force: :cascade do |t|
    t.string "message"
    t.string "image"
    t.bigint "user_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "comments_count", default: 0, null: false
    t.index ["user_id"], name: "index_posts_on_user_id"
  end

  create_table "project_environments", force: :cascade do |t|
    t.bigint "project_id", null: false
    t.string "name", null: false
    t.string "url"
    t.text "description"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["project_id", "name"], name: "index_project_environments_on_project_id_and_name", unique: true
    t.index ["project_id"], name: "index_project_environments_on_project_id"
  end

  create_table "project_users", force: :cascade do |t|
    t.bigint "project_id", null: false
    t.bigint "user_id", null: false
    t.string "role", default: "collaborator", null: false
    t.string "status", default: "active", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "allocation_percentage", default: 0, null: false
    t.string "workload_status", default: "partial", null: false
    t.index ["project_id", "user_id"], name: "index_project_users_on_project_id_and_user_id", unique: true
    t.index ["project_id"], name: "index_project_users_on_project_id"
    t.index ["user_id"], name: "index_project_users_on_user_id"
  end

  create_table "project_vault_items", force: :cascade do |t|
    t.bigint "project_id", null: false
    t.bigint "project_environment_id"
    t.string "title", null: false
    t.string "category"
    t.text "content", null: false
    t.string "username"
    t.jsonb "metadata", default: {}
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["project_environment_id"], name: "index_project_vault_items_on_project_environment_id"
    t.index ["project_id", "category"], name: "index_project_vault_items_on_project_id_and_category"
    t.index ["project_id"], name: "index_project_vault_items_on_project_id"
  end

  create_table "projects", force: :cascade do |t|
    t.string "name", null: false
    t.text "description"
    t.bigint "owner_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.date "start_date"
    t.date "end_date"
    t.string "status", default: "running"
    t.boolean "sheet_integration_enabled", default: false
    t.string "sheet_id"
    t.boolean "qa_mode_enabled", default: false, null: false
    t.index ["owner_id"], name: "index_projects_on_owner_id"
  end

  create_table "roles", force: :cascade do |t|
    t.string "name", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_roles_on_name", unique: true
  end

  create_table "skill_endorsements", force: :cascade do |t|
    t.bigint "user_skill_id", null: false
    t.bigint "endorser_id", null: false
    t.bigint "team_id"
    t.text "note"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["endorser_id", "user_skill_id"], name: "index_skill_endorsements_on_endorser_and_user_skill", unique: true
    t.index ["endorser_id"], name: "index_skill_endorsements_on_endorser_id"
    t.index ["team_id"], name: "index_skill_endorsements_on_team_id"
    t.index ["user_skill_id"], name: "index_skill_endorsements_on_user_skill_id"
  end

  create_table "skills", force: :cascade do |t|
    t.string "name", null: false
    t.string "category"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_skills_on_name", unique: true
  end

  create_table "sprints", force: :cascade do |t|
    t.string "name", null: false
    t.date "start_date", null: false
    t.date "end_date", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "status", default: "todo"
    t.integer "progress", default: 0
    t.integer "created_by"
    t.integer "updated_by"
    t.bigint "project_id", null: false
    t.index ["end_date"], name: "index_sprints_on_end_date"
    t.index ["project_id"], name: "index_sprints_on_project_id"
    t.index ["start_date"], name: "index_sprints_on_start_date"
  end

  create_table "task_logs", force: :cascade do |t|
    t.bigint "task_id", null: false
    t.bigint "developer_id", null: false
    t.date "log_date", null: false
    t.string "type", default: "code"
    t.decimal "hours_logged", precision: 5, scale: 2, null: false
    t.string "status", default: "todo"
    t.integer "created_by"
    t.integer "updated_by"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["developer_id"], name: "index_task_logs_on_developer_id"
    t.index ["log_date"], name: "index_task_logs_on_log_date"
    t.index ["task_id"], name: "index_task_logs_on_task_id"
  end

  create_table "tasks", force: :cascade do |t|
    t.string "task_id"
    t.string "task_url"
    t.string "type", null: false
    t.decimal "estimated_hours", precision: 5, scale: 2
    t.bigint "sprint_id"
    t.bigint "developer_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "status", default: "todo"
    t.integer "order", default: 0
    t.integer "assigned_to_user"
    t.integer "created_by"
    t.integer "updated_by"
    t.string "title"
    t.text "description"
    t.date "start_date"
    t.date "end_date"
    t.bigint "project_id"
    t.string "qa_assigned"
    t.string "internal_qa"
    t.boolean "blocker", default: false, null: false
    t.boolean "demo", default: false, null: false
    t.decimal "swag_point", precision: 6, scale: 2
    t.decimal "story_point", precision: 6, scale: 2
    t.decimal "dev_hours", precision: 6, scale: 2
    t.decimal "code_review_hours", precision: 6, scale: 2
    t.decimal "dev_to_qa_hours", precision: 6, scale: 2
    t.decimal "qa_hours", precision: 6, scale: 2
    t.decimal "automation_qa_hours", precision: 6, scale: 2
    t.decimal "total_hours", precision: 6, scale: 2
    t.string "priority"
    t.index ["developer_id"], name: "index_tasks_on_developer_id"
    t.index ["project_id"], name: "index_tasks_on_project_id"
    t.index ["sprint_id"], name: "index_tasks_on_sprint_id"
    t.index ["type"], name: "index_tasks_on_type"
  end

  create_table "team_users", force: :cascade do |t|
    t.bigint "team_id", null: false
    t.bigint "user_id", null: false
    t.string "role", default: "member", null: false
    t.string "status", default: "pending", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["team_id", "user_id"], name: "index_team_users_on_team_id_and_user_id", unique: true
    t.index ["team_id"], name: "index_team_users_on_team_id"
    t.index ["user_id"], name: "index_team_users_on_user_id"
  end

  create_table "teams", force: :cascade do |t|
    t.string "name", null: false
    t.text "description"
    t.bigint "owner_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["owner_id"], name: "index_teams_on_owner_id"
  end

  create_table "topic_follows", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "topic_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["topic_id"], name: "index_topic_follows_on_topic_id"
    t.index ["user_id", "topic_id"], name: "index_topic_follows_on_user_id_and_topic_id", unique: true
    t.index ["user_id"], name: "index_topic_follows_on_user_id"
  end

  create_table "topics", force: :cascade do |t|
    t.string "name", null: false
    t.text "description"
    t.integer "topic_follows_count", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_topics_on_name", unique: true
  end

  create_table "user_roles", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "role_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["role_id"], name: "index_user_roles_on_role_id"
    t.index ["user_id", "role_id"], name: "index_user_roles_on_user_id_and_role_id", unique: true
    t.index ["user_id"], name: "index_user_roles_on_user_id"
  end

  create_table "user_skills", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "skill_id", null: false
    t.string "proficiency", default: "beginner", null: false
    t.integer "endorsements_count", default: 0, null: false
    t.datetime "last_endorsed_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["skill_id"], name: "index_user_skills_on_skill_id"
    t.index ["user_id", "skill_id"], name: "index_user_skills_on_user_id_and_skill_id", unique: true
    t.index ["user_id"], name: "index_user_skills_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "jti"
    t.string "first_name"
    t.string "last_name"
    t.date "date_of_birth"
    t.string "confirmation_token"
    t.datetime "confirmed_at"
    t.datetime "confirmation_sent_at"
    t.string "unconfirmed_email"
    t.string "status", default: "new", null: false
    t.string "color_theme", default: "blue"
    t.boolean "dark_mode", default: false, null: false
    t.string "landing_page", default: "posts"
    t.string "availability_status", default: "available_now", null: false
    t.integer "current_projects_count", default: 0, null: false
    t.string "job_title", default: "Team Member", null: false
    t.bigint "department_id"
    t.string "keka_base_url"
    t.string "keka_api_key"
    t.string "keka_employee_id"
    t.jsonb "keka_profile_data", default: {}, null: false
    t.datetime "keka_last_synced_at"
    t.index ["availability_status"], name: "index_users_on_availability_status"
    t.index ["confirmation_token"], name: "index_users_on_confirmation_token", unique: true
    t.index ["department_id"], name: "index_users_on_department_id"
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
  end

  create_table "work_categories", force: :cascade do |t|
    t.string "name", null: false
    t.string "color"
    t.string "hex"
    t.integer "created_by"
    t.integer "updated_by"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "work_log_tags", force: :cascade do |t|
    t.bigint "work_log_id", null: false
    t.bigint "work_tag_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["work_log_id", "work_tag_id"], name: "index_work_log_tags_on_work_log_id_and_work_tag_id", unique: true
    t.index ["work_log_id"], name: "index_work_log_tags_on_work_log_id"
    t.index ["work_tag_id"], name: "index_work_log_tags_on_work_tag_id"
  end

  create_table "work_logs", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.date "log_date", null: false
    t.time "start_time", null: false
    t.time "end_time", null: false
    t.string "title", null: false
    t.text "description"
    t.bigint "category_id"
    t.bigint "priority_id"
    t.integer "actual_minutes", default: 0
    t.integer "created_by"
    t.integer "updated_by"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["category_id"], name: "index_work_logs_on_category_id"
    t.index ["priority_id"], name: "index_work_logs_on_priority_id"
    t.index ["user_id"], name: "index_work_logs_on_user_id"
  end

  create_table "work_notes", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.date "note_date", null: false
    t.text "content"
    t.integer "created_by"
    t.integer "updated_by"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id", "note_date"], name: "index_work_notes_on_user_id_and_note_date", unique: true
    t.index ["user_id"], name: "index_work_notes_on_user_id"
  end

  create_table "work_priorities", force: :cascade do |t|
    t.string "name", null: false
    t.string "color"
    t.string "hex"
    t.integer "created_by"
    t.integer "updated_by"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "work_tags", force: :cascade do |t|
    t.string "name", null: false
    t.integer "created_by"
    t.integer "updated_by"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_work_tags_on_name", unique: true
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "comments", "posts"
  add_foreign_key "comments", "users"
  add_foreign_key "friendships", "users", column: "followed_id"
  add_foreign_key "friendships", "users", column: "follower_id"
  add_foreign_key "issues", "projects"
  add_foreign_key "issues", "users", column: "assignee_user_id"
  add_foreign_key "issues", "users", column: "reporter_id"
  add_foreign_key "items", "users"
  add_foreign_key "knowledge_bookmarks", "users"
  add_foreign_key "learning_checkpoints", "learning_goals"
  add_foreign_key "learning_goals", "teams"
  add_foreign_key "learning_goals", "users"
  add_foreign_key "notifications", "users", column: "actor_id"
  add_foreign_key "notifications", "users", column: "recipient_id"
  add_foreign_key "post_likes", "posts"
  add_foreign_key "post_likes", "users"
  add_foreign_key "posts", "users"
  add_foreign_key "project_environments", "projects"
  add_foreign_key "project_users", "projects"
  add_foreign_key "project_users", "users"
  add_foreign_key "project_vault_items", "project_environments"
  add_foreign_key "project_vault_items", "projects"
  add_foreign_key "projects", "users", column: "owner_id"
  add_foreign_key "skill_endorsements", "teams"
  add_foreign_key "skill_endorsements", "user_skills"
  add_foreign_key "skill_endorsements", "users", column: "endorser_id"
  add_foreign_key "sprints", "projects"
  add_foreign_key "task_logs", "developers"
  add_foreign_key "task_logs", "tasks"
  add_foreign_key "tasks", "developers"
  add_foreign_key "tasks", "projects"
  add_foreign_key "tasks", "sprints"
  add_foreign_key "team_users", "teams"
  add_foreign_key "team_users", "users"
  add_foreign_key "teams", "users", column: "owner_id"
  add_foreign_key "topic_follows", "topics"
  add_foreign_key "topic_follows", "users"
  add_foreign_key "user_roles", "roles"
  add_foreign_key "user_roles", "users"
  add_foreign_key "user_skills", "skills"
  add_foreign_key "user_skills", "users"
  add_foreign_key "users", "departments"
  add_foreign_key "work_log_tags", "work_logs"
  add_foreign_key "work_log_tags", "work_tags"
  add_foreign_key "work_logs", "users"
  add_foreign_key "work_logs", "work_categories", column: "category_id"
  add_foreign_key "work_logs", "work_priorities", column: "priority_id"
  add_foreign_key "work_notes", "users"
end
