class AddConfirmableToUsers < ActiveRecord::Migration[7.1]
  def up
    add_column :users, :confirmation_token, :string
    add_column :users, :confirmed_at, :datetime
    add_column :users, :confirmation_sent_at, :datetime
    add_column :users, :unconfirmed_email, :string

    User.update_all confirmed_at: Time.current

    add_index :users, :confirmation_token, unique: true
  end

  def down
    remove_index :users, :confirmation_token
    remove_columns :users, :confirmation_token, :confirmed_at, :confirmation_sent_at, :unconfirmed_email
  end
end
