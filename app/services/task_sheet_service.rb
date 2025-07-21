require 'google/apis/sheets_v4'
require 'googleauth'
require 'date'

class TaskSheetService
  SPREADSHEET_ID = GoogleSheetsReader::SPREADSHEET_ID

  def initialize(sheet_name)
    @sheet_name = sheet_name
    @service = Google::Apis::SheetsV4::SheetsService.new
    @service.client_options.application_name = 'Rails Task Sheet'
    @service.authorization = authorize
  end

  def import_tasks(sprint_id:, created_by_id:)
    data = read_sheet
    import_tasks_from_sheet(data, sprint_id: sprint_id, created_by_id: created_by_id)
  end

  def export_tasks(tasks)
    write_tasks_to_sheet(tasks)
  end

  private

  def authorize
    scopes = ['https://www.googleapis.com/auth/spreadsheets']
    Google::Auth::ServiceAccountCredentials.make_creds(
      json_key_io: File.open(Rails.root.join('config/google_service_account.json')),
      scope: scopes
    ).tap(&:fetch_access_token!)
  end

  def read_sheet
    range = "#{@sheet_name}!A1:Z"
    response = @service.get_spreadsheet_values(SPREADSHEET_ID, range)
    response.values || []
  end

  def parse_date(value)
    return nil if value.blank?
    Date.parse(value.to_s) rescue nil
  end

  def map_status(value)
    val = value.to_s.downcase
    return 'completed' if val.include?('completed')
    return 'todo' if val.include?('todo')
    val
  end

  def import_tasks_from_sheet(sheet_data, sprint_id:, created_by_id:)
    sheet_data[1..].each do |row|
      next if row.compact.empty?

      task_id = row[1]
      title = row[2]
      estimated_hours = row[3].to_f
      developer_name = row[4]
      user_name = row[5]
      start_date = parse_date(row[6])
      end_date = parse_date(row[7])
      status = map_status(row[8])
      order = row[0].to_i

      developer = Developer.find_by(name: developer_name)
      user = User.find_by(first_name: user_name)

      task = Task.find_or_initialize_by(task_id: task_id)

      task.assign_attributes(
        task_url: "https://resmedsaas.atlassian.net/browse/#{task_id}",
        type: 'Code',
        estimated_hours: estimated_hours,
        sprint_id: sprint_id,
        developer_id: developer&.id,
        assigned_to_user: user&.id,
        created_by: created_by_id,
        updated_by: created_by_id,
        assigned_to_developer: developer&.id,
        title: title,
        description: task.description.presence || '',
        start_date: start_date,
        end_date: end_date,
        status: status,
        order: order
      )

      task.save!
    end
  end

  def write_tasks_to_sheet(tasks)
    clear_sheet

    values = [[
      'Order', 'Task ID', 'Task Title', 'Est. Hours',
      'Assigned To Developer', 'Assigned User', 'Start Date', 'End Date', 'Status'
    ]]

    tasks.each_with_index do |task, index|
      values << [
        index + 1,
        task.task_id,
        task.title,
        task.estimated_hours.to_i,
        task.developer&.name.to_s,
        task.assigned_user&.first_name.to_s,
        task.start_date&.day,
        task.end_date&.day,
        task.status.capitalize
      ]
    end

    value_range = Google::Apis::SheetsV4::ValueRange.new(values: values)

    @service.update_spreadsheet_value(
      SPREADSHEET_ID,
      "#{@sheet_name}!A1",
      value_range,
      value_input_option: 'RAW'
    )

    highlight_completed_rows(tasks)
  end

  def clear_sheet
    @service.clear_values(SPREADSHEET_ID, "#{@sheet_name}!A1:Z")
  end

  def highlight_completed_rows(tasks)
    requests = []
    tasks.each_with_index do |task, index|
      next unless task.status.to_s.downcase == 'completed'

      requests << Google::Apis::SheetsV4::Request.new(
        repeat_cell: Google::Apis::SheetsV4::RepeatCellRequest.new(
          range: Google::Apis::SheetsV4::GridRange.new(
            sheet_id: sheet_id,
            start_row_index: index + 1,
            end_row_index: index + 2,
            start_column_index: 0,
            end_column_index: 9
          ),
          cell: Google::Apis::SheetsV4::CellData.new(
            user_entered_format: Google::Apis::SheetsV4::CellFormat.new(
              background_color: Google::Apis::SheetsV4::Color.new(
                red: 0.85,
                green: 0.94,
                blue: 0.72
              )
            )
          ),
          fields: 'userEnteredFormat.backgroundColor'
        )
      )
    end

    return if requests.empty?

    batch_request = Google::Apis::SheetsV4::BatchUpdateSpreadsheetRequest.new(requests: requests)
    @service.batch_update_spreadsheet(SPREADSHEET_ID, batch_request)
  end

  def sheet_id
    @sheet_id ||= begin
      spreadsheet = @service.get_spreadsheet(SPREADSHEET_ID)
      sheet = spreadsheet.sheets.find { |s| s.properties.title == @sheet_name }
      sheet.properties.sheet_id
    end
  end
end

