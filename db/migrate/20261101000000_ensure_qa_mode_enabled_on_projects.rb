class EnsureQaModeEnabledOnProjects < ActiveRecord::Migration[7.1]
  def change
    unless column_exists?(:projects, :qa_mode_enabled)
      add_column :projects, :qa_mode_enabled, :boolean, default: false, null: false
    end
  end
end
