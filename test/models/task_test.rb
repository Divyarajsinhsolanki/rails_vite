require "test_helper"

class TaskTest < ActiveSupport::TestCase
  test "creates a default code log when developer and estimated hours are present" do
    developer = Developer.create!(name: "Dev One")

    task = Task.create!(
      task_id: "ABC-123",
      type: "Code",
      developer: developer,
      estimated_hours: 5,
      start_date: Date.new(2024, 5, 1)
    )

    assert_equal 1, task.task_logs.count
    log = task.task_logs.first
    assert_equal developer, log.developer
    assert_equal Date.new(2024, 5, 1), log.log_date
    assert_equal BigDecimal("5"), log.hours_logged
    assert_equal "Code", log.type
  end

  test "does not create a default log when no developer is assigned" do
    task = Task.create!(
      type: "general",
      title: "General backlog",
      estimated_hours: 3,
      start_date: Date.new(2024, 5, 1)
    )

    assert_empty task.task_logs
  end
end
