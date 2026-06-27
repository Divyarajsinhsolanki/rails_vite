class CreateKnowledgePromptRunsAndItems < ActiveRecord::Migration[8.1]
  def change
    create_table :knowledge_prompt_runs do |t|
      t.references :workspace, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.references :mcp_access_token, foreign_key: true
      t.text :prompt, null: false
      t.string :source, null: false, default: "mcp"
      t.string :generation_mode, null: false, default: "history"
      t.string :status, null: false, default: "completed"
      t.jsonb :metadata, null: false, default: {}

      t.timestamps
    end

    add_index :knowledge_prompt_runs, [:workspace_id, :user_id, :created_at], name: "idx_knowledge_prompt_runs_workspace_user_created"
    add_index :knowledge_prompt_runs, [:workspace_id, :generation_mode, :status], name: "idx_knowledge_prompt_runs_mode_status"

    create_table :knowledge_items do |t|
      t.references :workspace, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.references :knowledge_prompt_run, null: false, foreign_key: true
      t.string :title, null: false
      t.text :summary
      t.text :body
      t.string :category, null: false, default: "learning"
      t.string :item_type, null: false, default: "fact"
      t.string :collection_name
      t.string :source_name
      t.string :source_url
      t.string :source_key, null: false
      t.datetime :published_at
      t.jsonb :tags, null: false, default: []
      t.jsonb :payload, null: false, default: {}
      t.boolean :active, null: false, default: true
      t.datetime :archived_at
      t.references :replaced_by, foreign_key: { to_table: :knowledge_items }
      t.integer :position, null: false, default: 0

      t.timestamps
    end

    add_index :knowledge_items, [:workspace_id, :category, :active], name: "idx_knowledge_items_workspace_category_active"
    add_index :knowledge_items, [:user_id, :active, :created_at], name: "idx_knowledge_items_user_active_created"
    add_index :knowledge_items, [:user_id, :source_key, :active], name: "idx_knowledge_items_user_source_active"
    add_index :knowledge_items, [:knowledge_prompt_run_id, :position], name: "idx_knowledge_items_run_position"
  end
end
