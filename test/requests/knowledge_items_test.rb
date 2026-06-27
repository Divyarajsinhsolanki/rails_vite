require "test_helper"

class KnowledgeItemsTest < ActionDispatch::IntegrationTest
  setup do
    @workspace = Workspace.create!(name: "Knowledge API", slug: "knowledge-api", kind: "private")
    @foreign_workspace = Workspace.create!(name: "Foreign Knowledge API", slug: "foreign-knowledge-api", kind: "private")
    @user = create_test_user(workspace: @workspace, email: "knowledge-api@example.test")
    @foreign_user = create_test_user(workspace: @foreign_workspace, email: "foreign-knowledge-api@example.test")

    Current.user = @user
    Current.workspace = @workspace
    @run = @user.knowledge_prompt_runs.create!(prompt: "Give me MCP facts", source: "mcp")
    @item = @user.knowledge_items.create!(
      knowledge_prompt_run: @run,
      title: "MCP cards can include citations",
      summary: "Generated cards store sources and tags.",
      category: "tech",
      source_url: "https://example.test/mcp",
      tags: ["mcp", "citations"]
    )

    archived = @user.knowledge_items.create!(
      knowledge_prompt_run: @run,
      title: "Archived MCP card",
      category: "tech",
      source_key: "archived:mcp"
    )
    archived.archive!

    Current.user = @foreign_user
    Current.workspace = @foreign_workspace
    foreign_run = @foreign_user.knowledge_prompt_runs.create!(prompt: "Hidden facts")
    @foreign_user.knowledge_items.create!(
      knowledge_prompt_run: foreign_run,
      title: "Foreign hidden card",
      category: "tech"
    )

    Current.reset_all
    login_as(@user)
  end

  test "lists generated knowledge items scoped to current workspace and user" do
    get "/api/knowledge_items", params: { active: true, category: "tech" }, headers: json_headers

    assert_response :success
    titles = JSON.parse(response.body).map { |item| item.fetch("title") }
    assert_includes titles, "MCP cards can include citations"
    assert_not_includes titles, "Archived MCP card"
    assert_not titles.any? { |title| title.include?("Foreign") }
  end

  test "lists prompt runs with item counts" do
    get "/api/knowledge_prompt_runs", headers: json_headers

    assert_response :success
    run_payload = JSON.parse(response.body).find { |run| run.fetch("id") == @run.id }
    assert_equal "Give me MCP facts", run_payload.fetch("prompt")
    assert_equal 2, run_payload.fetch("item_count")
  end

  test "archives a generated knowledge item" do
    patch "/api/knowledge_items/#{@item.id}/archive", headers: json_headers

    assert_response :success
    payload = JSON.parse(response.body)
    assert_equal false, payload.fetch("active")
    assert @item.reload.archived_at.present?
  end

  private

  def login_as(user)
    post "/api/login", params: { auth: { email: user.email, password: "Password!42" } }
    assert_response :success
  end

  def json_headers
    { "Accept" => "application/json" }
  end
end
