class Api::SheetsController < Api::BaseController
  skip_before_action :authenticate_user!, only: [:show]

  def show
    sheet_name = params[:sheet] || 'X2'
    project = Project.find(params[:project_id]) if params[:project_id].present?
    reader = GoogleSheetsReader.new(sheet_name, project&.sheet_id)
    rows = reader.read_data
    render json: { rows: rows }
  rescue StandardError => e
    render json: { error: e.message }, status: :internal_server_error
  end
end
