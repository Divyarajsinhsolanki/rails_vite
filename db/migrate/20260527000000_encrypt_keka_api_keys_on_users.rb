class EncryptKekaApiKeysOnUsers < ActiveRecord::Migration[7.1]
  def up
    add_column :users, :encrypted_keka_api_key, :string
    add_column :users, :encrypted_keka_api_key_iv, :string

    User.reset_column_information
    User.where.not(keka_api_key: [nil, ""]).find_each do |user|
      plaintext_key = user[:keka_api_key]
      user[:keka_api_key] = nil
      user.keka_api_key = plaintext_key
      user.save!(validate: false)
    end
  end

  def down
    User.reset_column_information
    User.where.not(encrypted_keka_api_key: [nil, ""]).find_each do |user|
      decrypted_key = user.keka_api_key
      user.update_columns(keka_api_key: decrypted_key)
    end

    remove_column :users, :encrypted_keka_api_key_iv
    remove_column :users, :encrypted_keka_api_key
  end
end
