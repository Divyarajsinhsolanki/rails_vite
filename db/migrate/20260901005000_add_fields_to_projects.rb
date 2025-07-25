class AddFieldsToProjects < ActiveRecord::Migration[7.1]
  def change
    change_table :projects, bulk: true do |t|
      t.date :start_date
      t.date :end_date
      t.string :status, default: 'running'
      t.boolean :sheet_integration_enabled, default: false
      t.string :sheet_id
    end
  end
end
