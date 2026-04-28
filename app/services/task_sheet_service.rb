require 'google/apis/sheets_v4'
require 'googleauth'
require 'date'

class TaskSheetService
  include SheetOperationLogging

  def initialize(sheet_name, spreadsheet_id)
    @sheet_name = sheet_name
    @spreadsheet_id = spreadsheet_id
    @service = Google::Apis::SheetsV4::SheetsService.new
    @service.client_options.application_name = 'Rails Task Sheet'
    @service.authorization = authorize
  end

  def import_tasks(sprint_id:, created_by_id:, project_id: nil)
    log_sheet_info('Task sheet import started', sprint_id: sprint_id, project_id: project_id, created_by_id: created_by_id)
    data = read_sheet
    imported_count = import_tasks_from_sheet(data, sprint_id: sprint_id, created_by_id: created_by_id, project_id: project_id)
    log_sheet_info(
      'Task sheet import completed',
      sprint_id: sprint_id,
      project_id: project_id,
      created_by_id: created_by_id,
      imported_count: imported_count,
      source_row_count: data.size
    )
    imported_count
  rescue StandardError => e
    log_sheet_error(
      'Task sheet import failed',
      exception: e,
      payload: { sprint_id: sprint_id, project_id: project_id, created_by_id: created_by_id }
    )
    raise
  end

  def export_tasks(tasks)
    log_sheet_info('Task sheet export started', task_count: tasks.size)
    write_tasks_to_sheet(tasks)
    log_sheet_info('Task sheet export completed', task_count: tasks.size)
  rescue StandardError => e
    log_sheet_error('Task sheet export failed', exception: e, payload: { task_count: tasks.size })
    raise
  end

  private

  def authorize
    scopes = ['https://www.googleapis.com/auth/spreadsheets']
    Google::Auth::ServiceAccountCredentials.make_creds(
      json_key_io: File.open(Rails.root.join('config/google_service_account.json')),
      scope: scopes
    ).tap(&:fetch_access_token!)
  rescue StandardError => e
    log_sheet_error('Google Sheets read/write authorization failed', exception: e)
    raise
  end

  def read_sheet
    range = "#{@sheet_name}!A1:Z"
    ensure_spreadsheet_id!
    log_sheet_info('Task sheet read started', range: range)
    response = @service.get_spreadsheet_values(@spreadsheet_id, range)
    rows = response.values || []
    log_sheet_info('Task sheet read completed', range: range, row_count: rows.size)
    rows
  rescue StandardError => e
    log_sheet_error('Task sheet read failed', exception: e, payload: { range: range })
    raise
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

  def import_tasks_from_sheet(sheet_data, sprint_id:, created_by_id:, project_id: nil)
    imported_count = 0

    (sheet_data[1..] || []).each_with_index do |row, index|
      row_number = index + 2
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

      developer = find_user_by_name(developer_name)
      user = find_user_by_name(user_name)

      log_sheet_warn('Task import developer not found', row_number: row_number, developer_name: developer_name, task_id: task_id) if developer_name.present? && developer.nil?
      log_sheet_warn('Task import assigned user not found', row_number: row_number, user_name: user_name, task_id: task_id) if user_name.present? && user.nil?

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
        title: title,
        description: task.description.presence || '',
        start_date: start_date,
        end_date: end_date,
        status: status,
        order: order,
        project_id: project_id
      )

      task.save!
      imported_count += 1
    rescue StandardError => e
      log_sheet_error(
        'Task import row failed',
        exception: e,
        payload: {
          row_number: row_number,
          task_id: task_id,
          title: title,
          developer_name: developer_name,
          user_name: user_name,
          row: summarize_sheet_row(row)
        }
      )
      raise
    end

    imported_count
  end

  def write_tasks_to_sheet(tasks)
    clear_sheet

    values = [[
      'Order', 'Task ID', 'Task Title', 'Est. Hours',
      'Assigned To Developer', 'Assigned User', 'Start Date', 'End Date', 'Status'
    ]]

    tasks.each_with_index do |task, index|
      url = task.task_url.presence || "https://resmedsaas.atlassian.net/browse/#{task.task_id}"

      task_id_cell = if task.task_id.present?
        %Q{=HYPERLINK("#{url}","#{task.task_id}")}
      else
        ''
      end

      values << [
        index + 1,
        task_id_cell,
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
      @spreadsheet_id,
      "#{@sheet_name}!A1",
      value_range,
      value_input_option: 'USER_ENTERED'
    )

    highlight_completed_rows(tasks)
    highlight_in_progress_rows(tasks)
  end

  def clear_sheet
    ensure_spreadsheet_id!
    @service.clear_values(@spreadsheet_id, "#{@sheet_name}!A1:Z")
  end

  def find_user_by_name(value)
    normalized = value.to_s.strip.downcase
    return if normalized.blank?

    user_lookup[normalized]
  end

  def user_lookup
    @user_lookup ||= User.order(:id).each_with_object({}) do |user, lookup|
      [user.first_name, user.last_name, user.full_name, user.name, user.email].compact.each do |entry|
        normalized = entry.to_s.strip.downcase
        next if normalized.blank?

        lookup[normalized] ||= user
      end
    end
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
    @service.batch_update_spreadsheet(@spreadsheet_id, batch_request)
  end

  def highlight_in_progress_rows(tasks)
    requests = []
    tasks.each_with_index do |task, index|
      status = task.status.to_s.downcase
      next unless status == 'in progress' || status == 'inprogress'

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
                red: 1.0,
                green: 1.0,
                blue: 0.6
              )
            )
          ),
          fields: 'userEnteredFormat.backgroundColor'
        )
      )
    end

    return if requests.empty?

    batch_request = Google::Apis::SheetsV4::BatchUpdateSpreadsheetRequest.new(requests: requests)
    @service.batch_update_spreadsheet(@spreadsheet_id, batch_request)
  end

  def sheet_id
    @sheet_id ||= begin
      ensure_spreadsheet_id!
      spreadsheet = @service.get_spreadsheet(@spreadsheet_id)
      sheet = spreadsheet.sheets.find { |s| s.properties.title == @sheet_name }
      return sheet.properties.sheet_id if sheet

      raise StandardError, "Sheet not found: #{@sheet_name}"
    end
  end

  def ensure_spreadsheet_id!
    raise ArgumentError, 'Spreadsheet ID is missing' if @spreadsheet_id.blank?
  end
end
