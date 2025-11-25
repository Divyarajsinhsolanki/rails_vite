class AddQaModeEnabledToProjects < ActiveRecord::Migration[7.1]
  def change
    add_column :projects, :qa_mode_enabled, :boolean, default: false, null: false
  end
end
