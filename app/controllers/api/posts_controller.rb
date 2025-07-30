class Api::PostsController < Api::BaseController
  # before_action :authenticate_user!, only: [:create, :update, :destroy]
  include Rails.application.routes.url_helpers

  def index
    if request.format.html?
      if params[:user_id]
        posts = Post.includes(:user, :image_attachment)
                     .where(user_id: params[:user_id])
                     .order(created_at: :desc)
      else
        posts = Post.includes(:user, :image_attachment)
                     .order(created_at: :desc)
      end
      render json: posts.map { |post| serialize_post(post) }
    end
  end

  def create
    post = current_user.posts.build(post_params)
    if post.save
      render json: serialize_post(post), status: :created
    else
      render json: { errors: post.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    post = current_user.posts.find(params[:id])
    if post.update(post_params)
      render json: serialize_post(post)
    else
      render json: { errors: post.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    post = current_user.posts.find_by(id: params[:id])
    return head :forbidden unless post

    post.destroy
    render json: { message: "Post deleted successfully" }
  end

  private

  def post_params
    params.require(:post).permit(:message, :image)
  end

  def serialize_post(post)
    {
      id: post.id,
      message: post.message,
      image_url: post.image.attached? ? rails_blob_url(post.image, disposition: "attachment", only_path: true) : nil, 
      created_at: post.created_at.strftime("%Y-%m-%d %H:%M"),
      user: {
        id: post.user.id,
        email: post.user.email,
        profile_picture: post.user.profile_picture.attached? ?
          rails_blob_url(post.user.profile_picture, only_path: true) : nil
      }
    }
  end
end
