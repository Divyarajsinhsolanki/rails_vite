class CreateWorkLogs < ActiveRecord::Migration[7.1]
  def change
    create_table :work_logs do |t|
      t.references :user, null: false, foreign_key: true
      t.date :log_date, null: false
      t.time :start_time, null: false
      t.time :end_time, null: false
      t.string :title, null: false
      t.text :description
      t.references :category, foreign_key: { to_table: :work_categories }
      t.references :priority, foreign_key: { to_table: :work_priorities }
      t.integer :actual_minutes, default: 0
      t.integer :created_by
      t.integer :updated_by
      t.timestamps
    end
  end
end
