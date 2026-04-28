module SheetOperationLogging
  private

  def log_sheet_info(message, payload = {})
    AppEventLogger.info(:sheet_operations, source: self.class.name, message: message, payload: sheet_logging_payload.merge(payload))
  end

  def log_sheet_warn(message, payload = {})
    AppEventLogger.warn(:sheet_operations, source: self.class.name, message: message, payload: sheet_logging_payload.merge(payload))
  end

  def log_sheet_error(message, exception: nil, payload: {})
    AppEventLogger.error(:sheet_operations, source: self.class.name, message: message, exception: exception, payload: sheet_logging_payload.merge(payload))
  end

  def summarize_sheet_row(row)
    Array(row).first(12).map do |cell|
      value = cell.to_s
      value.length > 120 ? "#{value.first(120)}..." : value
    end
  end

  def sheet_logging_payload
    {
      project_id: instance_variable_defined?(:@project) ? @project&.id : nil,
      sheet_name: instance_variable_defined?(:@sheet_name) ? @sheet_name : nil,
      spreadsheet_id: instance_variable_defined?(:@spreadsheet_id) ? @spreadsheet_id : nil
    }.compact
  end
end
