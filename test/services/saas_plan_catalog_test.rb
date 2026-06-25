require "test_helper"

class SaasPlanCatalogTest < ActiveSupport::TestCase
  test "builds a starter workspace snapshot with limits and enabled modules" do
    workspace = Workspace.create!(name: "Starter SaaS", slug: "starter-saas", kind: "private")
    create_test_user(workspace: workspace, email: "starter-saas@example.test")
    Current.workspace = workspace
    Project.create!(name: "Starter project")

    snapshot = Saas::PlanCatalog.snapshot(workspace)

    assert_equal "starter", snapshot.dig(:plan, :key)
    assert_equal 5, snapshot.dig(:limits, :seats)
    assert_equal 1, snapshot.dig(:usage, :seats)
    assert_equal 1, snapshot.dig(:usage, :projects)
    assert snapshot.fetch(:modules).find { |mod| mod[:key] == "pdf_master" }[:enabled]
    assert_not snapshot.fetch(:modules).find { |mod| mod[:key] == "audit_logs" }[:enabled]
  end

  test "module overrides can enable enterprise modules before billing is wired" do
    workspace = Workspace.create!(
      name: "Override SaaS",
      slug: "override-saas",
      kind: "private",
      module_overrides: { audit_logs: true }
    )

    assert Saas::PlanCatalog.module_enabled?(workspace, "audit_logs")
  end

  test "demo workspaces default to the enterprise plan" do
    workspace = Workspace.create!(name: "Demo SaaS", slug: "demo-saas", kind: "demo")

    assert_equal "enterprise", workspace.plan_key
    assert_equal "active", workspace.billing_status
    assert Saas::PlanCatalog.module_enabled?(workspace, "enterprise_security")
  end
end
