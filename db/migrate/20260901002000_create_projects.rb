class CreateProjects < ActiveRecord::Migration[7.1]
  def change
    create_table :projects do |t|
      t.string :name, null: false
      t.text :description
      t.references :owner, foreign_key: { to_table: :users }
      t.string :issue_sheet_id
      t.string :issue_sheet_name, default: "Issue Tracker", null: false
      t.timestamps
    end
  end
end
