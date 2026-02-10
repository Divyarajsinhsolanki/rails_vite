class CreateCalendarEvents < ActiveRecord::Migration[7.1]
  def change
    create_table :calendar_events do |t|
      t.references :user, null: false, foreign_key: true
      t.references :project, foreign_key: true
      t.references :task, foreign_key: true
      t.references :sprint, foreign_key: true
      t.string :title, null: false
      t.text :description
      t.datetime :start_at, null: false
      t.datetime :end_at, null: false
      t.boolean :all_day, null: false, default: false
      t.string :event_type, null: false, default: 'meeting'
      t.string :visibility, null: false, default: 'personal'
      t.string :status, null: false, default: 'scheduled'
      t.string :location_or_meet_link

      t.timestamps
    end

    add_index :calendar_events, [:user_id, :start_at]
    add_index :calendar_events, [:visibility, :start_at]
    add_index :calendar_events, :event_type
  end
end
