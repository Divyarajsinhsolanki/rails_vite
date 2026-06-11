class AddWorkspacesAndPortfolio < ActiveRecord::Migration[7.1]
  TENANT_TABLES = %i[
    users projects teams departments tasks sprints issues posts comments post_likes
    conversations conversation_participants messages message_reactions calendar_events
    event_reminders work_logs work_notes work_categories work_priorities work_tags
    work_log_tags items skills user_skills skill_endorsements learning_goals
    learning_checkpoints notifications project_users team_users project_environments
    project_vault_items task_logs knowledge_bookmarks user_roles
  ].freeze

  def up
    create_table :workspaces do |t|
      t.string :name, null: false
      t.string :slug, null: false
      t.string :kind, null: false, default: "private"
      t.timestamps
    end
    add_index :workspaces, :slug, unique: true

    TENANT_TABLES.each do |table|
      add_reference table, :workspace, foreign_key: true, index: true, null: true
    end

    add_column :users, :demo_account, :boolean, null: false, default: false
    add_column :users, :site_admin, :boolean, null: false, default: false

    default_workspace_id = insert_default_workspace
    TENANT_TABLES.each do |table|
      execute <<~SQL.squish
        UPDATE #{quote_table_name(table)}
        SET workspace_id = #{default_workspace_id}
        WHERE workspace_id IS NULL
      SQL
      change_column_null table, :workspace_id, false
    end

    replace_workspace_unique_indexes
    create_portfolio_tables
  end

  def down
    drop_table :portfolio_features
    drop_table :portfolio_projects
    drop_table :portfolio_profiles

    restore_global_unique_indexes

    remove_column :users, :site_admin
    remove_column :users, :demo_account
    TENANT_TABLES.reverse_each do |table|
      remove_reference table, :workspace, foreign_key: true
    end
    drop_table :workspaces
  end

  private

  def insert_default_workspace
    execute <<~SQL
      INSERT INTO workspaces (name, slug, kind, created_at, updated_at)
      VALUES ('Private Workspace', 'private-workspace', 'private', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    SQL
    select_value("SELECT id FROM workspaces WHERE slug = 'private-workspace'").to_i
  end

  def replace_workspace_unique_indexes
    remove_index :departments, :name if index_exists?(:departments, :name, unique: true)
    add_index :departments, %i[workspace_id name], unique: true

    remove_index :issues, :issue_key if index_exists?(:issues, :issue_key, unique: true)
    add_index :issues, %i[workspace_id issue_key], unique: true

    remove_index :skills, :name if index_exists?(:skills, :name, unique: true)
    add_index :skills, %i[workspace_id name], unique: true

    add_index :work_tags, %i[workspace_id name], unique: true
  end

  def restore_global_unique_indexes
    remove_index :work_tags, %i[workspace_id name] if index_exists?(:work_tags, %i[workspace_id name])

    remove_index :skills, %i[workspace_id name] if index_exists?(:skills, %i[workspace_id name])
    add_index :skills, :name, unique: true

    remove_index :issues, %i[workspace_id issue_key] if index_exists?(:issues, %i[workspace_id issue_key])
    add_index :issues, :issue_key, unique: true

    remove_index :departments, %i[workspace_id name] if index_exists?(:departments, %i[workspace_id name])
    add_index :departments, :name, unique: true
  end

  def create_portfolio_tables
    create_table :portfolio_profiles do |t|
      t.string :full_name, null: false
      t.string :headline, null: false
      t.string :location
      t.text :summary, null: false
      t.jsonb :skills, null: false, default: []
      t.jsonb :metrics, null: false, default: []
      t.jsonb :social_links, null: false, default: {}
      t.jsonb :architecture, null: false, default: []
      t.jsonb :engineering_highlights, null: false, default: []
      t.boolean :published, null: false, default: false
      t.timestamps
    end

    create_table :portfolio_projects do |t|
      t.string :title, null: false
      t.string :slug, null: false
      t.string :tagline
      t.text :summary, null: false
      t.text :description
      t.jsonb :stack, null: false, default: []
      t.jsonb :metrics, null: false, default: []
      t.jsonb :engineering_highlights, null: false, default: []
      t.string :repository_url
      t.string :live_url
      t.integer :position, null: false, default: 0
      t.boolean :featured, null: false, default: false
      t.boolean :published, null: false, default: false
      t.timestamps
    end
    add_index :portfolio_projects, :slug, unique: true
    add_index :portfolio_projects, %i[published position]

    create_table :portfolio_features do |t|
      t.references :portfolio_project, null: false, foreign_key: true
      t.string :category, null: false
      t.string :title, null: false
      t.text :summary, null: false
      t.string :demo_path
      t.string :alt_text
      t.integer :position, null: false, default: 0
      t.boolean :published, null: false, default: false
      t.timestamps
    end
    add_index :portfolio_features, %i[portfolio_project_id published position], name: "idx_portfolio_features_order"
  end
end
