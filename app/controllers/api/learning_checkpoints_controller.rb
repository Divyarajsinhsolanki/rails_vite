class Api::LearningCheckpointsController < Api::BaseController
  before_action :set_learning_checkpoint, only: [:update, :destroy]

  def create
    goal = current_user.learning_goals.find(learning_checkpoint_params[:learning_goal_id])
    checkpoint = goal.learning_checkpoints.build(learning_checkpoint_params.except(:learning_goal_id))

    if checkpoint.save
      render json: serialize(checkpoint), status: :created
    else
      render json: { errors: checkpoint.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @learning_checkpoint.update(learning_checkpoint_params.except(:learning_goal_id))
      render json: serialize(@learning_checkpoint)
    else
      render json: { errors: @learning_checkpoint.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @learning_checkpoint.destroy
    head :no_content
  end

  private

  def learning_checkpoint_params
    params.require(:learning_checkpoint).permit(:learning_goal_id, :title, :completed, :resource_url)
  end

  def set_learning_checkpoint
    @learning_checkpoint = LearningCheckpoint.joins(:learning_goal)
                                             .where(learning_goals: { user_id: current_user.id })
                                             .find(params[:id])
  end

  def serialize(checkpoint)
    {
      id: checkpoint.id,
      learning_goal_id: checkpoint.learning_goal_id,
      title: checkpoint.title,
      completed: checkpoint.completed,
      resource_url: checkpoint.resource_url
    }
  end
end
