require "test_helper"

class WorkspaceScopingTest < ActiveSupport::TestCase
  test "workspace scoped records are hidden from another current workspace" do
    first = Workspace.create!(name: "First", slug: "first", kind: "private")
    second = Workspace.create!(name: "Second", slug: "second", kind: "private")

    Current.workspace = first
    project = Project.create!(name: "Private project")

    Current.workspace = second
    assert_nil Project.find_by(id: project.id)
  end

  test "cross workspace associations are rejected" do
    first = Workspace.create!(name: "First", slug: "first-association", kind: "private")
    second = Workspace.create!(name: "Second", slug: "second-association", kind: "private")
    user = create_user(first, "first@example.test")

    Current.workspace = second
    project = Project.create!(name: "Second project")
    membership = ProjectUser.new(project: project, user: user)

    assert_not membership.valid?
    assert_includes membership.errors[:user], "must belong to the same workspace"
  end

  test "workspace scoped queries fail closed without current workspace" do
    workspace = Workspace.create!(name: "Closed Scope", slug: "closed-scope", kind: "private")
    project = Project.create!(workspace: workspace, name: "Hidden without context")

    Current.reset_all

    assert_nil Project.find_by(id: project.id)
    assert_equal 0, Project.count
    assert_equal project, Project.in_workspace(workspace).find(project.id)
  end

  private

  def create_user(workspace, email)
    workspace.users.create!(
      email: email,
      password: "Password!42",
      password_confirmation: "Password!42",
      first_name: "Test",
      last_name: "User",
      job_title: "Engineer",
      status: "active",
      confirmed_at: Time.current
    )
  end
end
