require "open3"
require "pathname"

module Mcp
  class RepoTools
    BLOCKED_PATH_PATTERNS = [
      %r{\A\.env},
      %r{\Aconfig/(credentials|master\.key)},
      %r{\A(?:tmp|log|storage|node_modules|vendor/bundle|public/assets|app/assets/builds)/},
      %r{(?:^|/)(?:id_rsa|id_dsa|id_ecdsa|id_ed25519)\z},
      %r{\.(?:pem|key|p12|pfx)\z}
    ].freeze

    class << self
      def status
        output, error, status = run("git", "status", "--short")
        {
          repo_root: root.to_s,
          code_write_enabled: write_enabled?,
          clean: output.strip.empty? && status.success?,
          status: output.lines.map(&:chomp),
          error: error.presence
        }
      end

      def search(args)
        query = args[:query].to_s
        raise ToolExecutor::ToolError, "query is required" if query.blank?

        limit = bounded_limit(args[:limit], default: 50, max: 200)
        base_path = safe_path(args[:path].presence || ".")
        command = [
          "rg",
          "--line-number",
          "--column",
          "--no-heading",
          "--color",
          "never",
          "--glob",
          "!node_modules",
          "--glob",
          "!tmp",
          "--glob",
          "!log",
          "--glob",
          "!storage",
          "--glob",
          "!app/assets/builds",
          "--",
          query,
          relative_path(base_path)
        ]

        output, error, status = run(*command)
        raise ToolExecutor::ToolError, "repo_search failed: #{error.presence || output}" unless status.success? || status.exitstatus == 1

        matches = output.lines.first(limit).map do |line|
          path, line_number, column, text = line.chomp.split(":", 4)
          {
            path: path,
            line: line_number.to_i,
            column: column.to_i,
            text: text.to_s.truncate(500)
          }
        end

        {
          query: query,
          path: relative_path(base_path),
          count: matches.length,
          truncated: output.lines.length > matches.length,
          matches: matches
        }
      end

      def read_file(args)
        path = safe_path(args[:path])
        raise ToolExecutor::ToolError, "#{relative_path(path)} is not a file" unless path.file?

        max_bytes = bounded_limit(args[:max_bytes], default: 80_000, max: 200_000)
        content = path.binread(max_bytes + 1)
        truncated = content.bytesize > max_bytes
        content = content.byteslice(0, max_bytes) if truncated
        text = content.force_encoding("UTF-8")
        raise ToolExecutor::ToolError, "File is not valid UTF-8 text" unless text.valid_encoding?

        {
          path: relative_path(path),
          bytes_read: content.bytesize,
          truncated: truncated,
          content: text
        }
      end

      def apply_patch(args)
        patch = args[:patch].to_s
        preview = preview_patch(patch: patch)

        output, error, status = run("git", "apply", "--whitespace=fix", stdin_data: patch)
        raise ToolExecutor::ToolError, "Patch apply failed: #{error.presence || output}" unless status.success?

        {
          applied: true,
          changed_paths: preview[:changed_paths],
          message: "Patch applied successfully."
        }
      end

      def preview_patch(args)
        patch = args[:patch].to_s
        raise ToolExecutor::ToolError, "patch is required" if patch.blank?
        raise ToolExecutor::ToolError, "Patch is too large" if patch.bytesize > 200_000
        raise ToolExecutor::ToolError, "Binary git patches are not supported" if patch.include?("GIT binary patch")

        validate_patch_paths!(patch)

        check_output, check_error, check_status = run("git", "apply", "--check", "--whitespace=fix", stdin_data: patch)
        unless check_status.success?
          raise ToolExecutor::ToolError, "Patch check failed: #{check_error.presence || check_output}"
        end

        {
          valid: true,
          changed_paths: patch_paths(patch).uniq,
          message: "Patch passed git apply --check and was not applied."
        }
      end

      def write_enabled?
        ActiveModel::Type::Boolean.new.cast(ENV["MCP_ENABLE_CODE_TOOLS"])
      end

      private

      def root
        Rails.root
      end

      def run(*command, stdin_data: nil)
        Open3.capture3(*command, stdin_data: stdin_data, chdir: root.to_s)
      rescue Errno::ENOENT => e
        raise ToolExecutor::ToolError, "Command not available: #{e.message}"
      end

      def safe_path(raw_path)
        raise ToolExecutor::ToolError, "path is required" if raw_path.blank?

        relative = raw_path.to_s.delete_prefix("./")
        raise ToolExecutor::ToolError, "absolute paths are not allowed" if Pathname.new(relative).absolute?

        candidate = root.join(relative).cleanpath
        root_path = root.cleanpath.to_s
        unless candidate.to_s == root_path || candidate.to_s.start_with?("#{root_path}/")
          raise ToolExecutor::ToolError, "path escapes the repository root"
        end

        rel = relative_path(candidate)
        if blocked_path?(rel)
          raise ToolExecutor::ToolError, "#{rel} is blocked from MCP repository access"
        end

        candidate
      end

      def relative_path(path)
        pathname = path.is_a?(Pathname) ? path : Pathname.new(path.to_s)
        pathname.relative_path_from(root).to_s
      end

      def blocked_path?(relative)
        normalized = relative.delete_prefix("./")
        BLOCKED_PATH_PATTERNS.any? { |pattern| normalized.match?(pattern) }
      end

      def validate_patch_paths!(patch)
        paths = patch_paths(patch)
        raise ToolExecutor::ToolError, "No file paths found in patch" if paths.empty?

        paths.each { |path| safe_path(path) }
      end

      def patch_paths(patch)
        paths = []
        patch.each_line do |line|
          case line
          when /\Adiff --git a\/(.+?) b\/(.+)\s*\z/
            paths << Regexp.last_match(1)
            paths << Regexp.last_match(2)
          when /\A--- (?:a\/)?(.+)\s*\z/, /\A\+\+\+ (?:b\/)?(.+)\s*\z/
            path = Regexp.last_match(1)
            paths << path unless path == "/dev/null"
          when /\Arename from (.+)\s*\z/, /\Arename to (.+)\s*\z/
            paths << Regexp.last_match(1)
          end
        end
        paths.map { |path| path.delete_prefix("./") }.reject(&:blank?)
      end

      def bounded_limit(value, default:, max:)
        limit = value.to_i
        limit = default if limit < 1
        [limit, max].min
      end
    end
  end
end
