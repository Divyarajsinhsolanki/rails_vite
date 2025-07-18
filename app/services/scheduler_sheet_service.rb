require 'google/apis/sheets_v4'
require 'googleauth'

class SchedulerSheetService
  SPREADSHEET_ID = GoogleSheetsReader::SPREADSHEET_ID

  def initialize(sheet_name)
    @sheet_name = sheet_name
    @service = Google::Apis::SheetsV4::SheetsService.new
    @service.client_options.application_name = 'Rails Scheduler Sheet'
    @service.authorization = authorize
  end

  def export_logs(logs)
    developers = logs.map(&:developer).uniq.sort_by(&:name)
    dates = logs.map(&:log_date).uniq.sort
    matrix = {}
    dates.each { |d| matrix[d] = Hash.new { |h, k| h[k] = [] } }

    logs.each do |log|
      matrix[log.log_date][log.developer.name] << "#{log.task.task_id} (#{log.hours_logged}h) - #{log.type}"
    end

    values = [['Date'] + developers.map(&:name)]
    dates.each do |date|
      row = [date.to_s]
      developers.each do |dev|
        row << matrix[date][dev.name].join("\n")
      end
      values << row
    end

    write_sheet(values)
  end

  private

  def authorize
    scopes = ['https://www.googleapis.com/auth/spreadsheets']
    Google::Auth::ServiceAccountCredentials.make_creds(
      json_key_io: File.open(Rails.root.join('config/google_service_account.json')),
      scope: scopes
    ).tap(&:fetch_access_token!)
  end

  def write_sheet(values)
    clear_sheet
    value_range = Google::Apis::SheetsV4::ValueRange.new(values: values)
    @service.update_spreadsheet_value(
      SPREADSHEET_ID,
      "#{@sheet_name}!A1",
      value_range,
      value_input_option: 'RAW'
    )
  end

  def clear_sheet
    @service.clear_values(SPREADSHEET_ID, "#{@sheet_name}!A1:Z")
  end
end
