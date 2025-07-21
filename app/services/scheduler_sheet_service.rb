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
      matrix[log.log_date][log.developer.name] << log
    end

    values = [['Date'] + developers.map(&:name)]
    dates.each do |date|
      row = [date.to_s]
      developers.each do |dev|
        cell_logs = matrix[date][dev.name]
        row << cell_logs.map { |l| "#{l.task.task_id} (#{l.hours_logged}h) - #{l.type}" }.join("\n")
      end
      values << row
    end

    write_sheet(values)
    strike_completed_cells(matrix, developers, dates)
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

  def strike_completed_cells(matrix, developers, dates)
    requests = []

    dates.each_with_index do |date, r_idx|
      developers.each_with_index do |dev, c_idx|
        logs = matrix[date][dev.name]
        next unless logs.any? { |l| l.status.to_s.downcase == 'completed' }

        requests << Google::Apis::SheetsV4::Request.new(
          repeat_cell: Google::Apis::SheetsV4::RepeatCellRequest.new(
            range: Google::Apis::SheetsV4::GridRange.new(
              sheet_id: sheet_id,
              start_row_index: r_idx + 1,
              end_row_index: r_idx + 2,
              start_column_index: c_idx + 1,
              end_column_index: c_idx + 2
            ),
            cell: Google::Apis::SheetsV4::CellData.new(
              user_entered_format: Google::Apis::SheetsV4::CellFormat.new(
                text_format: Google::Apis::SheetsV4::TextFormat.new(strikethrough: true)
              )
            ),
            fields: 'userEnteredFormat.textFormat.strikethrough'
          )
        )
      end
    end

    return if requests.empty?

    batch = Google::Apis::SheetsV4::BatchUpdateSpreadsheetRequest.new(requests: requests)
    @service.batch_update_spreadsheet(SPREADSHEET_ID, batch)
  end

  def sheet_id
    @sheet_id ||= begin
      spreadsheet = @service.get_spreadsheet(SPREADSHEET_ID)
      sheet = spreadsheet.sheets.find { |s| s.properties.title == @sheet_name }
      sheet.properties.sheet_id
    end
  end
end
