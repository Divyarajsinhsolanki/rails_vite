class CreateIssues < ActiveRecord::Migration[7.1]
  def change
    create_table :issues do |t|
      t.references :project, null: false, foreign_key: true
      t.string :issue_key, null: false
      t.string :title, null: false
      t.string :status, default: 'New', null: false
      t.string :severity, default: 'Medium', null: false
      t.string :category
      t.string :module_name
      t.string :sub_module
      t.string :sprint_name
      t.string :task_id
      t.string :found_by
      t.date   :found_on
      t.text   :issue_description
      t.text   :pre_conditions
      t.text   :repro_steps
      t.text   :actual_result
      t.text   :expected_result
      t.string :attachment
      t.text   :comment

      t.timestamps
    end

    add_index :issues, :issue_key, unique: true
  end
end
