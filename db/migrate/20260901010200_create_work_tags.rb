class CreateWorkTags < ActiveRecord::Migration[7.1]
  def change
    create_table :work_tags do |t|
      t.string :name, null: false
      t.integer :created_by
      t.integer :updated_by
      t.timestamps
    end
    add_index :work_tags, :name, unique: true
  end
end
