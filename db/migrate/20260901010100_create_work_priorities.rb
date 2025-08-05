class CreateWorkPriorities < ActiveRecord::Migration[7.1]
  def change
    create_table :work_priorities do |t|
      t.string :name, null: false
      t.string :color
      t.string :hex
      t.integer :created_by
      t.integer :updated_by
      t.timestamps
    end
  end
end
