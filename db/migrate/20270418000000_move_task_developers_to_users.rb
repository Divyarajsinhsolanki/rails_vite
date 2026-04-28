class MoveTaskDevelopersToUsers < ActiveRecord::Migration[7.1]
  LEGACY_DEVELOPER_USER_ID_MAP = {
    1 => 51, # Ankit
    2 => 42, # Nirav
    3 => 52  # Natvar
  }.freeze

  def up
    remove_legacy_foreign_keys!
    remap_developer_ids!
    add_user_foreign_keys!
    drop_table :assignees if table_exists?(:assignees)
  end

  def down
    raise ActiveRecord::IrreversibleMigration, 'Task developer references have been moved from assignees to users'
  end

  private

  def remap_developer_ids!
    mapping = inferred_developer_user_map.merge(LEGACY_DEVELOPER_USER_ID_MAP)
    return if mapping.empty?

    used_ids = select_values(<<~SQL).map(&:to_i)
      SELECT DISTINCT developer_id
      FROM tasks
      WHERE developer_id IS NOT NULL
      UNION
      SELECT DISTINCT developer_id
      FROM task_logs
      WHERE developer_id IS NOT NULL
    SQL

    unmapped_ids = used_ids - mapping.keys
    raise "Unmapped developer ids: #{unmapped_ids.join(', ')}" if unmapped_ids.any?

    remap_table_developer_ids!(:tasks, mapping)
    remap_table_developer_ids!(:task_logs, mapping)
    validate_developer_ids!(:tasks)
    validate_developer_ids!(:task_logs)
  end

  def inferred_developer_user_map
    return {} unless table_exists?(:assignees)

    rows = select_rows(<<~SQL)
      SELECT assignees.id, users.id
      FROM assignees
      INNER JOIN users
        ON LOWER(users.first_name) = LOWER(assignees.name)
    SQL

    rows.each_with_object({}) do |(assignee_id, user_id), map|
      next if assignee_id.blank? || user_id.blank?

      map[assignee_id.to_i] = user_id.to_i
    end
  end

  def remap_table_developer_ids!(table_name, mapping)
    return if mapping.empty?

    cases = mapping.map { |old_id, new_id| "WHEN #{old_id} THEN #{new_id}" }.join(' ')
    ids = mapping.keys.join(', ')

    execute <<~SQL
      UPDATE #{table_name}
      SET developer_id = CASE developer_id #{cases} ELSE developer_id END
      WHERE developer_id IN (#{ids})
    SQL
  end

  def validate_developer_ids!(table_name)
    invalid_ids = select_values(<<~SQL).map(&:to_i)
      SELECT DISTINCT developer_id
      FROM #{table_name}
      WHERE developer_id IS NOT NULL
        AND developer_id NOT IN (SELECT id FROM users)
    SQL

    raise "Invalid #{table_name}.developer_id values: #{invalid_ids.join(', ')}" if invalid_ids.any?
  end

  def remove_legacy_foreign_keys!
    remove_foreign_key :tasks, column: :developer_id if foreign_key_exists?(:tasks, :assignees, column: :developer_id)
    remove_foreign_key :task_logs, column: :developer_id if foreign_key_exists?(:task_logs, :assignees, column: :developer_id)
  end

  def add_user_foreign_keys!
    add_foreign_key :tasks, :users, column: :developer_id unless foreign_key_exists?(:tasks, :users, column: :developer_id)
    add_foreign_key :task_logs, :users, column: :developer_id unless foreign_key_exists?(:task_logs, :users, column: :developer_id)
  end
end
