class AddRecurrenceAndExternalFieldsToCalendarEvents < ActiveRecord::Migration[7.1]
  def change
    add_column :calendar_events, :recurrence_rule, :string, default: 'none', null: false
    add_column :calendar_events, :recurrence_until, :datetime
    add_column :calendar_events, :recurrence_parent_id, :bigint
    add_column :calendar_events, :external_source, :string
    add_column :calendar_events, :external_id, :string

    add_index :calendar_events, :recurrence_parent_id
    add_index :calendar_events, [:external_source, :external_id]
  end
end
