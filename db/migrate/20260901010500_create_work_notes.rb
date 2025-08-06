class CreateWorkNotes < ActiveRecord::Migration[7.1]
  def change
    create_table :work_notes do |t|
      t.references :user, null: false, foreign_key: true
      t.date :note_date, null: false
      t.text :content
      t.integer :created_by
      t.integer :updated_by
      t.timestamps
    end
    add_index :work_notes, [:user_id, :note_date], unique: true
  end
end
