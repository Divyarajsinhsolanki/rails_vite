class CreateTasks < ActiveRecord::Migration[7.1]
  def change
    create_table :tasks do |t|
      t.string  :task_id,        null: false
      t.string  :task_url
      t.string :type,   null: false
      t.decimal :estimated_hours, precision: 5, scale: 2
      t.date    :date,           null: false
      t.references :sprint,      foreign_key: true, null: true
      t.references :developer,   foreign_key: true, null: false
      t.boolean :is_struck, default: false

      t.timestamps
    end

    add_index :tasks, :date
  end
end
