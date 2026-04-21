class ReplaceDevelopersWithAssignees < ActiveRecord::Migration[7.1]
  def up
    return if table_exists?(:assignees) && !table_exists?(:developers)

    unless table_exists?(:assignees)
      create_table :assignees do |t|
        t.string :name, null: false
        t.string :role_type, null: false, default: 'developer'
        t.timestamps
      end
    end

    add_index :assignees, :name, unique: true unless index_exists?(:assignees, :name)
    add_index :assignees, :role_type unless index_exists?(:assignees, :role_type)

    if table_exists?(:developers)
      execute <<~SQL
        INSERT INTO assignees (id, name, role_type, created_at, updated_at)
        SELECT id, name, 'developer', created_at, updated_at
        FROM developers
        ORDER BY id ASC
        ON CONFLICT (id) DO UPDATE
        SET
          name = EXCLUDED.name,
          role_type = EXCLUDED.role_type,
          created_at = EXCLUDED.created_at,
          updated_at = EXCLUDED.updated_at
      SQL

      execute <<~SQL
        SELECT setval(
          pg_get_serial_sequence('assignees', 'id'),
          COALESCE((SELECT MAX(id) FROM assignees), 1),
          (SELECT COUNT(*) > 0 FROM assignees)
        )
      SQL
    end

    remove_foreign_key :tasks, :developers if foreign_key_exists?(:tasks, :developers)
    remove_foreign_key :task_logs, :developers if foreign_key_exists?(:task_logs, :developers)

    add_foreign_key :tasks, :assignees, column: :developer_id unless foreign_key_exists?(:tasks, :assignees, column: :developer_id)
    add_foreign_key :task_logs, :assignees, column: :developer_id unless foreign_key_exists?(:task_logs, :assignees, column: :developer_id)

    drop_table :developers if table_exists?(:developers)
  end

  def down
    return if table_exists?(:developers) && !table_exists?(:assignees)

    unless table_exists?(:developers)
      create_table :developers do |t|
        t.string :name, null: false
        t.timestamps
      end
    end

    add_index :developers, :name, unique: true unless index_exists?(:developers, :name)

    if table_exists?(:assignees)
      execute <<~SQL
        INSERT INTO developers (id, name, created_at, updated_at)
        SELECT id, name, created_at, updated_at
        FROM assignees
        ORDER BY id ASC
        ON CONFLICT (id) DO UPDATE
        SET
          name = EXCLUDED.name,
          created_at = EXCLUDED.created_at,
          updated_at = EXCLUDED.updated_at
      SQL

      execute <<~SQL
        SELECT setval(
          pg_get_serial_sequence('developers', 'id'),
          COALESCE((SELECT MAX(id) FROM developers), 1),
          (SELECT COUNT(*) > 0 FROM developers)
        )
      SQL
    end

    remove_foreign_key :tasks, column: :developer_id if foreign_key_exists?(:tasks, :assignees, column: :developer_id)
    remove_foreign_key :task_logs, column: :developer_id if foreign_key_exists?(:task_logs, :assignees, column: :developer_id)

    add_foreign_key :tasks, :developers, column: :developer_id unless foreign_key_exists?(:tasks, :developers, column: :developer_id)
    add_foreign_key :task_logs, :developers, column: :developer_id unless foreign_key_exists?(:task_logs, :developers, column: :developer_id)

    drop_table :assignees if table_exists?(:assignees)
  end
end
