class AddNotificationPreferencesToUsers < ActiveRecord::Migration[7.0]
  def change
    add_column :users, :notification_preferences, :jsonb, null: false, default: {
      commented: true,
      assigned: true,
      update: true,
      digest: false
    }
  end
end
