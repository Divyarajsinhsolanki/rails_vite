class EnhancePortfolioAndWorkspaceConstraints < ActiveRecord::Migration[7.1]
  def change
    add_column :portfolio_projects, :case_study, :jsonb, null: false, default: {}
    add_column :portfolio_projects, :seo, :jsonb, null: false, default: {}
    add_column :portfolio_features, :review_notes, :text
    add_column :portfolio_features, :tour_position, :integer, null: false, default: 0

    add_index :portfolio_features,
              %i[portfolio_project_id tour_position],
              name: "idx_portfolio_features_tour_order"

    remove_index :work_tags, :name if index_exists?(:work_tags, :name, unique: true)

    add_index :projects, %i[workspace_id name], unique: true
    add_index :teams, %i[workspace_id name], unique: true
    add_index :work_categories, %i[workspace_id name], unique: true
    add_index :work_priorities, %i[workspace_id name], unique: true
  end
end
