class Api::WorkNotesController < Api::BaseController
  before_action :set_note, only: [:update, :destroy]

  def index
    if params[:date].present?
      note = current_user.work_notes.find_by(note_date: params[:date])
      render json: note || {}
    else
      render json: current_user.work_notes
    end
  end

  def create
    note = current_user.work_notes.new(work_note_params)
    if note.save
      render json: note, status: :created
    else
      render json: { errors: note.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @note.update(work_note_params)
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
    @note = current_user.work_notes.find(params[:id])
  end

  def work_note_params
    params.require(:work_note).permit(:note_date, :content)
  end
end
