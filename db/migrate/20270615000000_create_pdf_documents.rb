class CreatePdfDocuments < ActiveRecord::Migration[8.0]
  def change
    create_table :pdf_documents do |t|
      t.references :workspace, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.string :title, null: false
      t.string :original_filename, null: false
      t.integer :page_count
      t.boolean :encrypted, null: false, default: false
      t.bigint :current_version_id
      t.integer :lock_version, null: false, default: 0
      t.timestamps
    end

    add_index :pdf_documents, [:user_id, :updated_at]
    add_index :pdf_documents, [:workspace_id, :user_id]

    create_table :pdf_document_versions do |t|
      t.references :workspace, null: false, foreign_key: true
      t.references :pdf_document, null: false, foreign_key: true
      t.references :created_by, null: false, foreign_key: { to_table: :users }
      t.bigint :parent_version_id
      t.integer :version_number, null: false
      t.string :operation, null: false
      t.integer :page_count
      t.boolean :encrypted, null: false, default: false
      t.bigint :byte_size, null: false, default: 0
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end

    add_index :pdf_document_versions,
              [:pdf_document_id, :version_number],
              unique: true,
              name: "idx_pdf_document_versions_number"
    add_foreign_key :pdf_document_versions,
                    :pdf_document_versions,
                    column: :parent_version_id,
                    on_delete: :nullify
    add_foreign_key :pdf_documents,
                    :pdf_document_versions,
                    column: :current_version_id,
                    on_delete: :nullify

    create_table :pdf_document_operations do |t|
      t.references :workspace, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.references :pdf_document, foreign_key: true
      t.references :base_version
      t.string :kind, null: false
      t.string :status, null: false, default: "queued"
      t.integer :progress, null: false, default: 0
      t.jsonb :parameters, null: false, default: {}
      t.jsonb :result, null: false, default: {}
      t.text :error_message
      t.datetime :started_at
      t.datetime :completed_at
      t.timestamps
    end

    add_index :pdf_document_operations, [:user_id, :created_at]
    add_index :pdf_document_operations, [:status, :created_at]
    add_foreign_key :pdf_document_operations,
                    :pdf_document_versions,
                    column: :base_version_id,
                    on_delete: :nullify

    create_table :pdf_document_artifacts do |t|
      t.references :workspace, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.references :pdf_document, foreign_key: true
      t.references :pdf_document_operation, foreign_key: true
      t.string :kind, null: false
      t.datetime :expires_at, null: false
      t.timestamps
    end

    add_index :pdf_document_artifacts, :expires_at
  end
end
