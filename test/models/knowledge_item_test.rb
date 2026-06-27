require "test_helper"

class KnowledgeItemTest < ActiveSupport::TestCase
  setup do
    @workspace = Workspace.create!(name: "Knowledge Models", slug: "knowledge-models", kind: "private")
    @user = create_test_user(workspace: @workspace, email: "knowledge-model@example.test")
    Current.user = @user
    Current.workspace = @workspace
    @run = @user.knowledge_prompt_runs.create!(prompt: "Give me useful Rails facts")
  end

  test "assigns defaults for generated knowledge records" do
    item = @user.knowledge_items.create!(
      knowledge_prompt_run: @run,
      title: "Rails migrations are reversible",
      summary: "Many migration helpers know how to reverse themselves.",
      tags: ["rails", "", :db]
    )

    assert_equal @workspace, item.workspace
    assert_equal @user, item.user
    assert_equal "learning", item.category
    assert_equal "fact", item.item_type
    assert_equal ["rails", "db"], item.tags
    assert item.source_key.present?
    assert item.active?
  end

  test "archives with replacement linkage" do
    old_item = @user.knowledge_items.create!(
      knowledge_prompt_run: @run,
      title: "Old fact",
      source_key: "rails:fact"
    )
    new_item = @user.knowledge_items.create!(
      knowledge_prompt_run: @run,
      title: "New fact",
      source_key: "rails:fact"
    )

    old_item.archive!(replacement: new_item)

    assert_not old_item.reload.active?
    assert_equal new_item.id, old_item.replaced_by_id
    assert old_item.archived_at.present?
  end
end
