class EncryptKekaApiKeysOnUsers < ActiveRecord::Migration[7.1]
  def up
    return unless table_exists?(:users) && column_exists?(:users, :keka_api_key)

    add_column :users, :encrypted_keka_api_key, :string unless column_exists?(:users, :encrypted_keka_api_key)
    add_column :users, :encrypted_keka_api_key_iv, :string unless column_exists?(:users, :encrypted_keka_api_key_iv)

    User.reset_column_information
    User.where.not(keka_api_key: [nil, ""]).find_each do |user|
      plaintext_key = user[:keka_api_key]
      user.encrypted_keka_api_key = nil
      user.encrypted_keka_api_key_iv = nil
      user.keka_api_key = plaintext_key
      user.save!(validate: false)
    end
  end

  def down
    return unless table_exists?(:users) && column_exists?(:users, :encrypted_keka_api_key)

    add_column :users, :keka_api_key, :string unless column_exists?(:users, :keka_api_key)

    User.reset_column_information
    User.where.not(encrypted_keka_api_key: [nil, ""]).find_each do |user|
      decrypted_key = user.keka_api_key
      user.update_columns(keka_api_key: decrypted_key)
    end

    remove_column :users, :encrypted_keka_api_key_iv if column_exists?(:users, :encrypted_keka_api_key_iv)
    remove_column :users, :encrypted_keka_api_key if column_exists?(:users, :encrypted_keka_api_key)
  end
end
