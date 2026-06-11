class ScopeLegacySocialTablesToWorkspaces < ActiveRecord::Migration[7.1]
  TABLES = %i[friendships topics topic_follows].freeze

  def up
    workspace_id = select_value("SELECT id FROM workspaces WHERE slug = 'private-workspace' ORDER BY id LIMIT 1").to_i

    TABLES.each do |table|
      add_reference table, :workspace, foreign_key: true, index: true, null: true
      execute <<~SQL.squish
        UPDATE #{quote_table_name(table)}
        SET workspace_id = #{workspace_id}
        WHERE workspace_id IS NULL
      SQL
      change_column_null table, :workspace_id, false
    end

    remove_index :topics, :name if index_exists?(:topics, :name, unique: true)
    add_index :topics, %i[workspace_id name], unique: true
  end

  def down
    remove_index :topics, %i[workspace_id name] if index_exists?(:topics, %i[workspace_id name])
    add_index :topics, :name, unique: true

    TABLES.reverse_each do |table|
      remove_reference table, :workspace, foreign_key: true
    end
  end
end
