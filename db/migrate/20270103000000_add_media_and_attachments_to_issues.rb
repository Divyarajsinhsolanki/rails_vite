class AddMediaAndAttachmentsToIssues < ActiveRecord::Migration[7.1]
  def change
    add_column :issues, :media_urls, :jsonb, default: [], null: false
    add_column :issues, :attachment_urls, :jsonb, default: [], null: false
  end
end
