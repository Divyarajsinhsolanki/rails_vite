class CreateSkills < ActiveRecord::Migration[7.1]
  def change
    create_table :skills do |t|
      t.string :name, null: false
      t.string :category
      t.timestamps
    end

    add_index :skills, :name, unique: true
  end
end
