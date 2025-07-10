class Api::NotesController < Api::BaseController
  before_action :set_note, only: [:update, :destroy]

  def index
    @notes = current_user.notes.order(created_at: :desc)
    render json: @notes
  end

  def create
    @note = current_user.notes.build(note_params)
    if @note.save
      render json: @note, status: :created
    else
      render json: { errors: @note.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @note.update(note_params)
      render json: @note
    else
      render json: { errors: @note.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @note.destroy
    head :no_content
  end

  private

  def set_note
    @note = current_user.notes.find(params[:id])
  end

  def note_params
    params.require(:note).permit(:title, :body)
  end
end
