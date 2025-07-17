class SheetsController < ApplicationController
  def show
    sheet_name = params[:sheet] || 'Sheet1'
    reader = GoogleSheetsReader.new(sheet_name)
    @rows = reader.read_data
  rescue StandardError => e
    @error = e.message
  end
end
