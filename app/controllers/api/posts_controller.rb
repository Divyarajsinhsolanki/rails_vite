class Api::PostsController < Api::BaseController
  # before_action :authenticate_user!, only: [:create, :update, :destroy]
  include Rails.application.routes.url_helpers

  before_action :set_post, only: [:like, :unlike]

  def index
    if request.format.html?
      posts = Post.includes(:user, :image_attachment, :post_likes)
      posts = posts.where(user_id: params[:user_id]) if params[:user_id]
      posts = posts.order(created_at: :desc)
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

  def like
    like = @post.post_likes.find_or_initialize_by(user: current_user)
    if like.persisted? || like.save
      @post = find_post(@post.id)
      render json: serialize_post(@post), status: :ok
    else
      render json: { errors: like.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def unlike
    like = @post.post_likes.find_by(user: current_user)
    like&.destroy
    @post = find_post(@post.id)
    render json: serialize_post(@post), status: :ok
  end

  private

  def post_params
    params.require(:post).permit(:message, :image)
  end

  def set_post
    @post = find_post(params[:id])
  end

  def find_post(id)
    Post.includes(:user, :image_attachment, :post_likes).find(id)
  end

  def serialize_post(post)
    {
      id: post.id,
      message: post.message,
      image_url: post.image.attached? ? rails_blob_url(post.image, disposition: "attachment", only_path: true) : nil,
      created_at: post.created_at.strftime("%Y-%m-%d %H:%M"),
      likes_count: post.post_likes.size,
      liked_by_current_user: current_user.present? && post.post_likes.any? { |like| like.user_id == current_user.id },
      user: {
        id: post.user.id,
        email: post.user.email,
        first_name: post.user.first_name,
        last_name: post.user.last_name,
        profile_picture: post.user.profile_picture.attached? ?
          rails_blob_url(post.user.profile_picture, only_path: true) : nil
      }
    }
  end
end
