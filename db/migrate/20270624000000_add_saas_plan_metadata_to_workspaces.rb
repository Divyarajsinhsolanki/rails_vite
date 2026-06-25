class AddSaasPlanMetadataToWorkspaces < ActiveRecord::Migration[8.0]
  def change
    add_column :workspaces, :plan_key, :string, null: false, default: "starter"
    add_column :workspaces, :billing_status, :string, null: false, default: "trialing"
    add_column :workspaces, :trial_ends_at, :datetime
    add_column :workspaces, :seat_limit_override, :integer
    add_column :workspaces, :module_overrides, :jsonb, null: false, default: {}

    add_index :workspaces, :plan_key
    add_index :workspaces, :billing_status

    reversible do |dir|
      dir.up do
        execute <<~SQL.squish
          UPDATE workspaces
          SET plan_key = 'enterprise', billing_status = 'active'
          WHERE kind = 'demo'
        SQL
      end
    end
  end
end
