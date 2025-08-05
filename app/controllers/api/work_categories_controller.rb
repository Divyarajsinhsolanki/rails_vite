class Api::WorkCategoriesController < Api::BaseController
  before_action :set_category, only: [:update, :destroy]

  def index
    render json: WorkCategory.all
  end

  def create
    category = WorkCategory.new(category_params)
    if category.save
      render json: category, status: :created
    else
      render json: { errors: category.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @category.update(category_params)
      render json: @category
    else
      render json: { errors: @category.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @category.destroy
    head :no_content
  end

  private

  def set_category
    @category = WorkCategory.find(params[:id])
  end

  def category_params
    params.require(:work_category).permit(:name, :color, :hex)
  end
end
