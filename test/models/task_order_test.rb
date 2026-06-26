require "test_helper"

class TaskOrderTest < ActiveSupport::TestCase
  setup do
    @workspace = Workspace.create!(name: "Task Order", slug: "task-order", kind: "private")
    @user = create_test_user(workspace: @workspace, email: "task-order@example.test")
    Current.user = @user
    Current.workspace = @workspace
    @project = Project.create!(name: "Ordered Project", owner: @user)
    @sprint = @project.sprints.create!(name: "Sprint 1", start_date: Date.new(2026, 6, 1), end_date: Date.new(2026, 6, 5))
  end

  test "created developer task is appended to its sprint assignment group" do
    @project.tasks.create!(
      task_id: "ORDER-1",
      type: "Code",
      title: "First task",
      sprint: @sprint,
      developer: @user,
      created_by: @user.id,
      order: 1
    )

    created = @project.tasks.create!(
      task_id: "ORDER-2",
      type: "Code",
      title: "Second task",
      sprint: @sprint,
      developer: @user,
      created_by: @user.id
    )

    assert_equal 2, created.order
  end

  test "created qa task is appended to its qa assignment group" do
    @project.tasks.create!(
      type: "qa",
      title: "First QA task",
      sprint: @sprint,
      qa_assigned: "Riya QA",
      created_by: @user.id,
      order: 3
    )

    created = @project.tasks.create!(
      type: "qa",
      title: "Second QA task",
      sprint: @sprint,
      qa_assigned: "Riya QA",
      created_by: @user.id
    )

    assert_equal 4, created.order
  end

  test "explicit positive order is preserved" do
    created = @project.tasks.create!(
      task_id: "ORDER-EXPLICIT",
      type: "Code",
      title: "Explicit task",
      sprint: @sprint,
      developer: @user,
      created_by: @user.id,
      order: 9
    )

    assert_equal 9, created.order
  end
end
