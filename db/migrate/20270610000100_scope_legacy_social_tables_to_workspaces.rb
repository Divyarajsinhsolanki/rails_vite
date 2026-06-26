class ScopeLegacySocialTablesToWorkspaces < ActiveRecord::Migration[7.1]
  TABLES = %i[friendships topics topic_follows].freeze

  def up
    workspace_id = select_value("SELECT id FROM workspaces WHERE slug = 'private-workspace' ORDER BY id LIMIT 1").to_i

    TABLES.each do |table|
      next unless table_exists?(table)

      add_reference table, :workspace, foreign_key: true, index: true, null: true unless column_exists?(table, :workspace_id)
      execute <<~SQL.squish
        UPDATE #{quote_table_name(table)}
        SET workspace_id = #{workspace_id}
        WHERE workspace_id IS NULL
      SQL
      change_column_null table, :workspace_id, false
    end

    return unless table_exists?(:topics)

    remove_index :topics, :name if index_exists?(:topics, :name, unique: true)
    add_index :topics, %i[workspace_id name], unique: true unless index_exists?(:topics, %i[workspace_id name], unique: true)
  end

  def down
    if table_exists?(:topics)
      remove_index :topics, %i[workspace_id name] if index_exists?(:topics, %i[workspace_id name])
      add_index :topics, :name, unique: true unless index_exists?(:topics, :name, unique: true)
    end

    TABLES.reverse_each do |table|
      next unless table_exists?(table) && column_exists?(table, :workspace_id)

      remove_reference table, :workspace, foreign_key: true
    end
  end
end
