class AddDetailsToDepartments < ActiveRecord::Migration[7.1]
  def change
    add_column :departments, :description, :text
    add_reference :departments, :manager, null: true, foreign_key: { to_table: :users }
  end
end
