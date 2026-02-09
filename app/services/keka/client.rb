module Keka
  class Client
    DEFAULT_TIMEOUT = 10

    def initialize(base_url:, api_key:)
      @base_url = normalize_base_url(base_url)
      @api_key = api_key
    end

    def employee_profile(employee_id)
      get("/employees/#{employee_id}")
    end

    def attendance_logs(employee_id, start_date: nil, end_date: nil)
      params = { employeeId: employee_id }
      params[:from] = start_date if start_date
      params[:to] = end_date if end_date
      get("/attendance/logs", params)
    end

    def timesheets(employee_id, start_date: nil, end_date: nil)
      params = { employeeId: employee_id }
      params[:from] = start_date if start_date
      params[:to] = end_date if end_date
      get("/time/entries", params)
    end

    def leave_balances(employee_id)
      get("/leave/balance", { employeeId: employee_id })
    end

    private

    def normalize_base_url(base_url)
      return "" if base_url.blank?

      trimmed = base_url.to_s.strip
      trimmed = trimmed.chomp("/")
      trimmed.end_with?("/api/v1") ? trimmed : "#{trimmed}/api/v1"
    end

    def connection
      @connection ||= Faraday.new(url: @base_url) do |conn|
        conn.request :json
        conn.response :json, content_type: /\bjson$/
        conn.options.timeout = DEFAULT_TIMEOUT
        conn.options.open_timeout = DEFAULT_TIMEOUT
        conn.adapter Faraday.default_adapter
      end
    end

    def get(path, params = {})
      response = connection.get(path) do |req|
        req.headers["Accept"] = "application/json"
        req.headers["Content-Type"] = "application/json"
        req.headers["Authorization"] = "Bearer #{@api_key}"
        req.headers["x-api-key"] = @api_key
        req.params.update(params) if params.present?
      end
      if response.success?
        { success: true, status: response.status, data: response.body }
      else
        { success: false, status: response.status, error: response.body.presence || response.reason_phrase }
      end
    rescue Faraday::Error => e
      { success: false, error: e.message }
    end
  end
end
