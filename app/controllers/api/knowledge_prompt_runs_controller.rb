class Api::KnowledgePromptRunsController < Api::BaseController
  def index
    runs = current_user.knowledge_prompt_runs.includes(:knowledge_items).order(created_at: :desc).limit(limit_param)
    render json: runs.map { |run| serialize_run(run) }
  end

  private

  def limit_param
    params.fetch(:limit, 50).to_i.clamp(1, 100)
  end

  def serialize_run(run)
    {
      id: run.id,
      prompt: run.prompt,
      source: run.source,
      generation_mode: run.generation_mode,
      status: run.status,
      metadata: run.metadata,
      item_count: run.knowledge_items.size,
      created_at: run.created_at,
      updated_at: run.updated_at
    }
  end
end
