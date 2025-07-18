require 'google/apis/sheets_v4'
require 'googleauth'

class GoogleSheetsReader
  SPREADSHEET_ID = ENV['GOOGLE_SPREADSHEET_ID']

  def initialize(sheet_name)
    @sheet_name = sheet_name
    @service = Google::Apis::SheetsV4::SheetsService.new
    @service.client_options.application_name = 'Rails Sheet Reader'
    @service.authorization = authorize
  end

  def read_data
    range = "#{@sheet_name}!A1:Z"
    response = @service.get_spreadsheet_values(SPREADSHEET_ID, range)
    response.values
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
  end
end
