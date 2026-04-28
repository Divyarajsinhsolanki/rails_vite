require 'google/apis/sheets_v4'
require 'googleauth'

class GoogleSheetsReader
  include SheetOperationLogging

  def initialize(sheet_name, spreadsheet_id)
    @sheet_name = sheet_name
    @spreadsheet_id = spreadsheet_id
    @service = Google::Apis::SheetsV4::SheetsService.new
    @service.client_options.application_name = 'Rails Sheet Reader'
    @service.authorization = authorize
  end

  def read_data
    range = "#{@sheet_name}!A1:Z"
    ensure_spreadsheet_id!
    log_sheet_info('Sheet read started', range: range)
    response = @service.get_spreadsheet_values(@spreadsheet_id, range)
    rows = response.values || []
    log_sheet_info('Sheet read completed', range: range, row_count: rows.size)
    rows
  rescue StandardError => e
    log_sheet_error('Sheet read failed', exception: e, payload: { range: range })
    raise
  end

  private

  def authorize
    scopes = ['https://www.googleapis.com/auth/spreadsheets.readonly']
    authorizer = Google::Auth::ServiceAccountCredentials.make_creds(
      json_key_io: File.open(Rails.root.join('config/google_service_account.json')),
      scope: scopes
    )
    authorizer.fetch_access_token!
    authorizer
  rescue StandardError => e
    log_sheet_error('Google Sheets readonly authorization failed', exception: e)
    raise
  end

  def ensure_spreadsheet_id!
    raise ArgumentError, 'Spreadsheet ID is missing' if @spreadsheet_id.blank?
  end
end
