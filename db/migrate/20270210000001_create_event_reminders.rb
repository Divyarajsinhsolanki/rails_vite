class CreateEventReminders < ActiveRecord::Migration[7.1]
  def change
    create_table :event_reminders do |t|
      t.references :calendar_event, null: false, foreign_key: true
      t.string :channel, null: false, default: 'in_app'
      t.integer :minutes_before, null: false, default: 10
      t.datetime :send_at, null: false
      t.datetime :sent_at
      t.string :state, null: false, default: 'pending'

      t.timestamps
    end

    add_index :event_reminders, [:state, :send_at]
    add_index :event_reminders, [:calendar_event_id, :minutes_before, :channel], unique: true, name: 'idx_unique_event_reminder_window'
  end
end
