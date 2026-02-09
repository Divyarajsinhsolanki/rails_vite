module Keka
  class SyncService
    class SyncError < StandardError; end

    def initialize(user)
      @user = user
    end

    def call
      validate!

      client = Client.new(base_url: @user.keka_base_url, api_key: @user.keka_api_key)
      range_start = 30.days.ago.to_date
      range_end = Date.current

      payload = {
        profile: client.employee_profile(@user.keka_employee_id),
        attendance: client.attendance_logs(@user.keka_employee_id, start_date: range_start, end_date: range_end),
        timesheets: client.timesheets(@user.keka_employee_id, start_date: range_start, end_date: range_end),
        leave_balances: client.leave_balances(@user.keka_employee_id)
      }

      @user.update!(keka_profile_data: payload, keka_last_synced_at: Time.current)
      payload
    rescue SyncError
      raise
    rescue StandardError => e
      raise SyncError, e.message
    end

    private

    def validate!
      return if @user.keka_base_url.present? && @user.keka_api_key.present? && @user.keka_employee_id.present?

      raise SyncError, "Keka credentials are missing. Please save base URL, API key, and employee ID."
    end
  end
end
