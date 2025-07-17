class Api::SheetsController < Api::BaseController
  skip_before_action :authenticate_user!, only: [:show]

  def show
    sheet_name = params[:sheet] || 'Sheet1'
    reader = GoogleSheetsReader.new(sheet_name)
    rows = reader.read_data
    render json: { rows: rows }
  rescue StandardError => e
    render json: { error: e.message }, status: :internal_server_error
  end
end
