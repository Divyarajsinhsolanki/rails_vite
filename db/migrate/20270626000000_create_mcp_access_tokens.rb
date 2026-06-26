class CreateMcpAccessTokens < ActiveRecord::Migration[8.0]
  def change
    create_table :mcp_access_tokens do |t|
      t.references :workspace, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.string :name, null: false
      t.string :token_digest, null: false
      t.jsonb :scopes, null: false, default: []
      t.datetime :last_used_at
      t.datetime :expires_at
      t.datetime :revoked_at

      t.timestamps
    end

    add_index :mcp_access_tokens, :token_digest, unique: true
    add_index :mcp_access_tokens, [:workspace_id, :user_id]
    add_index :mcp_access_tokens, :revoked_at
  end
end
