require "test_helper"

class ShowcaseSeedersTest < ActiveSupport::TestCase
  test "portfolio and demo seeders are idempotent and synthetic" do
    PortfolioSeeder.new.call
    DemoWorkspaceSeeder.new.call

    first_counts = showcase_counts

    PortfolioSeeder.new.call
    DemoWorkspaceSeeder.new.call

    assert_equal first_counts, showcase_counts
    demo_workspace = Workspace.find_by!(kind: "demo")
    names = demo_workspace.users.order(:id).pluck(:first_name, :last_name)
    assert_includes names, ["Demo", "Visitor"]
    assert_includes names, ["Demo", "Engineer"]
    assert_includes names, ["Demo", "QA"]
  end

  private

  def showcase_counts
    demo_workspace = Workspace.find_by!(kind: "demo")
    {
      portfolio_projects: PortfolioProject.count,
      portfolio_features: PortfolioFeature.count,
      demo_users: demo_workspace.users.count,
      demo_projects: Project.unscoped.where(workspace: demo_workspace).count,
      demo_tasks: Task.unscoped.where(workspace: demo_workspace).count,
      demo_posts: Post.unscoped.where(workspace: demo_workspace).count
    }
  end
end
