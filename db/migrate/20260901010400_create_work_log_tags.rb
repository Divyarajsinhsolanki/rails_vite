class CreateWorkLogTags < ActiveRecord::Migration[7.1]
  def change
    create_table :work_log_tags do |t|
      t.references :work_log, null: false, foreign_key: true
      t.references :work_tag, null: false, foreign_key: true
      t.timestamps
    end
    add_index :work_log_tags, [:work_log_id, :work_tag_id], unique: true
  end
end
