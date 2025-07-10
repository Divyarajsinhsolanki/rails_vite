class Api::ItemsController < Api::BaseController
  before_action :set_item, only: [:update, :destroy]

  def index
    items = current_user.items
    if params[:q].present?
      query = "%#{params[:q]}%"
      items = items.where("title ILIKE ? OR content ILIKE ?", query, query)
    end
    render json: items.order(:id)
  end

  def create
    item = current_user.items.build(item_params)
    if item.save
      render json: item, status: :created
    else
      render json: { errors: item.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @item.update(item_params)
      render json: @item
    else
      render json: { errors: @item.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @item.destroy
    head :no_content
  end

  private

  def set_item
    @item = current_user.items.find(params[:id])
  end

  def item_params
    params.require(:item).permit(:title, :category, :content)
  end
end
