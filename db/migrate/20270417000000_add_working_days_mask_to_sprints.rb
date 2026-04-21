class AddWorkingDaysMaskToSprints < ActiveRecord::Migration[7.1]
  def change
    # Bitmask for working days:
    # 0 => Sunday, 1 => Monday, ..., 6 => Saturday
    # Default is Mon-Fri (bits 1..5 => 62)
    add_column :sprints, :working_days_mask, :integer, null: false, default: 62
    add_index :sprints, :working_days_mask
  end
end

