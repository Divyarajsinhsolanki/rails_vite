class FinalizeEncryptedKekaApiKeysOnUsers < ActiveRecord::Migration[7.1]
  class MigrationUser < ApplicationRecord
    self.table_name = "users"

    attr_encrypted :keka_api_key,
                   key: ENV.fetch("KEKA_API_KEY_ENCRYPTION_KEY"),
                   algorithm: "aes-256-gcm"
  end

  def up
    return unless table_exists?(:users)

    add_column :users, :encrypted_keka_api_key, :string unless column_exists?(:users, :encrypted_keka_api_key)
    add_column :users, :encrypted_keka_api_key_iv, :string unless column_exists?(:users, :encrypted_keka_api_key_iv)

    MigrationUser.reset_column_information

    if column_exists?(:users, :keka_api_key)
      MigrationUser.where.not(keka_api_key: [nil, ""]).find_each do |user|
        user.encrypted_keka_api_key = nil
        user.encrypted_keka_api_key_iv = nil
        user.keka_api_key = user[:keka_api_key]
        user.save!(validate: false)
      end

      remove_column :users, :keka_api_key
      MigrationUser.reset_column_information
    end

    clear_invalid_encrypted_keys
  end

  def down
    return unless table_exists?(:users)

    add_column :users, :keka_api_key, :string unless column_exists?(:users, :keka_api_key)
    MigrationUser.reset_column_information

    if column_exists?(:users, :encrypted_keka_api_key)
      MigrationUser.where.not(encrypted_keka_api_key: [nil, ""]).find_each do |user|
        user.update_columns(keka_api_key: user.keka_api_key)
      end
    end

    remove_column :users, :encrypted_keka_api_key_iv if column_exists?(:users, :encrypted_keka_api_key_iv)
    remove_column :users, :encrypted_keka_api_key if column_exists?(:users, :encrypted_keka_api_key)
  end

  private

  def clear_invalid_encrypted_keys
    return unless column_exists?(:users, :encrypted_keka_api_key)

    MigrationUser.where.not(encrypted_keka_api_key: [nil, ""]).find_each do |user|
      user.keka_api_key
    rescue OpenSSL::Cipher::CipherError, ArgumentError
      user.update_columns(encrypted_keka_api_key: nil, encrypted_keka_api_key_iv: nil)
    end
  end
end
