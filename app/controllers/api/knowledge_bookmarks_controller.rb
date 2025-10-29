require "digest"

class Api::KnowledgeBookmarksController < Api::BaseController
  before_action :set_bookmark, only: [:update, :destroy, :mark_reviewed]

  def index
    bookmarks = current_user.knowledge_bookmarks.order(created_at: :desc)
    render json: bookmarks.map { |bookmark| serialize_bookmark(bookmark) }
  end

  def create
    bookmark = current_user.knowledge_bookmarks.find_or_initialize_by(identity_params)
    bookmark.assign_attributes(bookmark_params)

    if bookmark.save
      render json: serialize_bookmark(bookmark), status: :created
    else
      render json: { errors: bookmark.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @bookmark.update(bookmark_params)
      render json: serialize_bookmark(@bookmark)
    else
      render json: { errors: @bookmark.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @bookmark.destroy
    head :no_content
  end

  def mark_reviewed
    @bookmark.mark_reviewed!
    render json: serialize_bookmark(@bookmark)
  end

  private

  def set_bookmark
    @bookmark = current_user.knowledge_bookmarks.find(params[:id])
  end

  def identity_params
    computed_source_id = params[:source_id].presence
    if computed_source_id.blank? && params[:payload].present?
      payload_param = params[:payload]
      payload_hash = payload_param.is_a?(ActionController::Parameters) ? payload_param.to_unsafe_h : payload_param
      computed_source_id = Digest::SHA256.hexdigest(payload_hash.to_json)
    end

    { card_type: params[:card_type], source_id: computed_source_id }
  end

  def bookmark_params
    params.permit(:collection_name, :reminder_interval_days).tap do |permitted|
      if params.key?(:payload)
        payload_param = params[:payload]
        permitted[:payload] = payload_param.is_a?(ActionController::Parameters) ? payload_param.to_unsafe_h : payload_param
      end
    end
  end

  def serialize_bookmark(bookmark)
    bookmark.as_json(only: [:id, :card_type, :collection_name, :source_id, :payload, :last_viewed_at, :last_reminded_at, :next_reminder_at, :reminder_interval_days, :created_at, :updated_at])
  end
end
