require "open3"
require "timeout"

module Mcp
  class RuntimeTools
    MUTATING_SQL_PATTERN = /\b(insert|update|delete|drop|alter|create|truncate|grant|revoke|copy|vacuum|refresh|call|execute|merge)\b/i

    class << self
      def db_query(args)
        sql = args[:sql].to_s.strip
        raise ToolExecutor::ToolError, "sql is required" if sql.blank?
        validate_read_only_sql!(sql)

        limit = bounded_limit(args[:limit], default: 50, max: 500)
        statement_timeout_ms = bounded_limit(args[:timeout_ms], default: 5_000, max: 30_000)
        result = nil

        ActiveRecord::Base.transaction(requires_new: true) do
          connection = ActiveRecord::Base.connection
          connection.execute("SET TRANSACTION READ ONLY")
          connection.execute("SET LOCAL statement_timeout = #{statement_timeout_ms.to_i}")
          result = connection.exec_query(sql)
          raise ActiveRecord::Rollback
        end

        rows = result.to_a.first(limit)
        {
          columns: result.columns,
          row_count: result.rows.length,
          returned_count: rows.length,
          truncated: result.rows.length > rows.length,
          rows: rows
        }
      rescue ActiveRecord::StatementInvalid => e
        raise ToolExecutor::ToolError, "db_query failed: #{e.message}"
      end

      def rails_runner(args)
        code = args[:code].to_s
        raise ToolExecutor::ToolError, "code is required" if code.blank?
        raise ToolExecutor::ToolError, "confirmation must be RUN_RAILS_CODE" unless args[:confirmation].to_s == "RUN_RAILS_CODE"

        timeout_seconds = bounded_limit(args[:timeout_seconds], default: 30, max: 180)
        max_bytes = bounded_limit(args[:max_output_bytes], default: 80_000, max: 200_000)
        output, error, status, timed_out = run_with_timeout(["bundle", "exec", "rails", "runner", code], timeout_seconds)
        stdout, stdout_truncated = truncate_output(output, max_bytes)
        stderr, stderr_truncated = truncate_output(error, max_bytes)

        {
          success: status&.success? || false,
          exit_status: status&.exitstatus,
          timed_out: timed_out,
          stdout: stdout,
          stderr: stderr,
          stdout_truncated: stdout_truncated,
          stderr_truncated: stderr_truncated
        }
      end

      def rails_console(args)
        rails_runner(args)
      end

      private

      def validate_read_only_sql!(sql)
        raise ToolExecutor::ToolError, "Only SELECT, WITH, and EXPLAIN queries are allowed" unless sql.match?(/\A\s*(select|with|explain)\b/i)
        raise ToolExecutor::ToolError, "Multiple SQL statements are not allowed" if sql.include?(";")
        raise ToolExecutor::ToolError, "Mutating SQL is not allowed" if sql.match?(MUTATING_SQL_PATTERN)
      end

      def run_with_timeout(command, timeout_seconds)
        timed_out = false
        output = error = status = nil
        Timeout.timeout(timeout_seconds) do
          output, error, status = Open3.capture3(*command, chdir: Rails.root.to_s)
        end
        [output, error, status, timed_out]
      rescue Timeout::Error
        timed_out = true
        ["", "Command timed out after #{timeout_seconds} seconds", nil, timed_out]
      rescue Errno::ENOENT => e
        raise ToolExecutor::ToolError, "Command not available: #{e.message}"
      end

      def truncate_output(output, max_bytes)
        output = output.to_s
        truncated = output.bytesize > max_bytes
        output = output.byteslice(0, max_bytes) if truncated
        [output, truncated]
      end

      def bounded_limit(value, default:, max:)
        limit = value.to_i
        limit = default if limit < 1
        [limit, max].min
      end
    end
  end
end
