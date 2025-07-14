class CreateTaskLogs < ActiveRecord::Migration[7.1]
  def change
    create_table :task_logs do |t|
      t.references :task, null: false, foreign_key: true
      t.references :developer, null: false, foreign_key: true
      t.date :log_date, null: false
      t.string :type, default: 'code'
      t.decimal :hours_logged, precision: 5, scale: 2, null: false
      t.string :status, default: 'todo'
      t.integer :created_by
      t.integer :updated_by

      t.timestamps
    end

    add_index :task_logs, :log_date
  end
end
