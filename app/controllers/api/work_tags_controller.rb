class Api::WorkTagsController < Api::BaseController
  before_action :set_tag, only: [:update, :destroy]

  def index
    render json: WorkTag.all
  end

  def create
    tag = WorkTag.new(tag_params)
    if tag.save
      render json: tag, status: :created
    else
      render json: { errors: tag.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @tag.update(tag_params)
      render json: @tag
    else
      render json: { errors: @tag.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @tag.destroy
    head :no_content
  end

  private

  def set_tag
    @tag = WorkTag.find(params[:id])
  end

  def tag_params
    params.require(:work_tag).permit(:name)
  end
end
