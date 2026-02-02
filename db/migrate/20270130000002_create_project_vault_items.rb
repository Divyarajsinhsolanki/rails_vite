class CreateProjectVaultItems < ActiveRecord::Migration[7.1]
  def change
    create_table :project_vault_items do |t|
      t.references :project, null: false, foreign_key: true
      t.references :project_environment, null: true, foreign_key: true
      t.string :title, null: false
      t.string :category
      t.text :content, null: false
      t.string :username
      t.jsonb :metadata, default: {}

      t.timestamps
    end

    add_index :project_vault_items, [:project_id, :category]
  end
end
