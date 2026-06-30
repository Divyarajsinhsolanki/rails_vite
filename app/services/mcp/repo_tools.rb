require "digest"
require "open3"
require "pathname"
require "fileutils"
require "timeout"

module Mcp
  class RepoTools
    BLOCKED_PATH_PATTERNS = [
      %r{\A\.env},
      %r{\Aconfig/(credentials|master\.key)},
      %r{\A(?:tmp|log|storage|node_modules|vendor/bundle|public/assets|app/assets/builds)/},
      %r{(?:^|/)(?:id_rsa|id_dsa|id_ecdsa|id_ed25519)\z},
      %r{\.(?:pem|key|p12|pfx)\z}
    ].freeze
    TEST_COMMANDS = {
      "mcp_requests" => %w[bundle exec rails test test/requests/mcp_controller_test.rb],
      "rails_all" => %w[bundle exec rails test],
      "yarn_build" => %w[yarn build],
      "yarn_test" => %w[yarn test]
    }.freeze

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
          sha256: Digest::SHA256.hexdigest(content),
          truncated: truncated,
          content: text
        }
      end

      def write_file(args)
        path = safe_path(args[:path])
        content = args[:content].to_s
        raise ToolExecutor::ToolError, "content is too large" if content.bytesize > 500_000
        raise ToolExecutor::ToolError, "content must be valid UTF-8 text" unless content.valid_encoding?
        raise ToolExecutor::ToolError, "#{relative_path(path)} is a directory" if path.directory?
        raise ToolExecutor::ToolError, "#{relative_path(path)} is a symlink and cannot be written through MCP" if path.symlink?

        ensure_real_parent_inside_root!(path)

        existed = path.exist?
        previous_content = existed ? path.binread : nil
        previous_sha = previous_content ? Digest::SHA256.hexdigest(previous_content) : nil
        expected_sha = args[:expected_sha256].presence

        if existed && expected_sha.blank?
          raise ToolExecutor::ToolError, "expected_sha256 is required when overwriting an existing file. Call repo_read_file first and pass its sha256."
        end

        if expected_sha.present? && expected_sha != previous_sha
          raise ToolExecutor::ToolError, "expected_sha256 does not match current file content. Read the file again before writing."
        end

        FileUtils.mkdir_p(path.dirname)
        path.binwrite(content)
        new_sha = Digest::SHA256.hexdigest(content)

        {
          written: true,
          path: relative_path(path),
          created: !existed,
          bytes_written: content.bytesize,
          previous_sha256: previous_sha,
          sha256: new_sha,
          message: "File written successfully."
        }
      end

      def diff(args)
        paths = Array(args[:paths]).map(&:to_s).reject(&:blank?)
        validate_paths!(paths) if paths.any?
        staged = ActiveModel::Type::Boolean.new.cast(args[:staged])
        max_bytes = bounded_limit(args[:max_bytes], default: 80_000, max: 200_000)
        base_command = staged ? ["git", "diff", "--cached"] : ["git", "diff"]
        path_args = paths.any? ? ["--", *paths] : []

        stat_output, stat_error, stat_status = run(*base_command, "--stat", *path_args)
        raise ToolExecutor::ToolError, "repo_diff stat failed: #{stat_error.presence || stat_output}" unless stat_status.success?

        diff_output, diff_error, diff_status = run(*base_command, *path_args)
        raise ToolExecutor::ToolError, "repo_diff failed: #{diff_error.presence || diff_output}" unless diff_status.success?

        truncated = diff_output.bytesize > max_bytes
        diff_output = diff_output.byteslice(0, max_bytes) if truncated

        {
          staged: staged,
          paths: paths,
          stat: stat_output,
          diff: diff_output,
          truncated: truncated
        }
      end

      def commit(args)
        message = args[:message].to_s.strip
        raise ToolExecutor::ToolError, "message is required" if message.blank?

        paths = Array(args[:paths]).map(&:to_s).reject(&:blank?)
        raise ToolExecutor::ToolError, "paths must include at least one file to commit" if paths.empty?
        validate_paths!(paths)

        add_output, add_error, add_status = run("git", "add", "--", *paths)
        raise ToolExecutor::ToolError, "git add failed: #{add_error.presence || add_output}" unless add_status.success?

        commit_output, commit_error, commit_status = run("git", "commit", "-m", message)
        raise ToolExecutor::ToolError, "git commit failed: #{commit_error.presence || commit_output}" unless commit_status.success?

        {
          committed: true,
          message: message,
          paths: paths,
          output: commit_output.presence || commit_error
        }
      end

      def run_tests(args)
        target = args[:target].presence || "mcp_requests"
        command = test_command(target, args)
        timeout_seconds = bounded_limit(args[:timeout_seconds], default: 120, max: 600)
        max_bytes = bounded_limit(args[:max_output_bytes], default: 80_000, max: 200_000)
        output, error, status, timed_out = run_with_timeout(command, timeout_seconds)
        stdout, stdout_truncated = truncate_output(output, max_bytes)
        stderr, stderr_truncated = truncate_output(error, max_bytes)

        {
          target: target,
          command: command.join(" "),
          success: status&.success? || false,
          exit_status: status&.exitstatus,
          timed_out: timed_out,
          stdout: stdout,
          stderr: stderr,
          stdout_truncated: stdout_truncated,
          stderr_truncated: stderr_truncated
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

        validate_paths!(paths)
      end

      def validate_paths!(paths)
        paths.each { |path| safe_path(path) }
      end

      def ensure_real_parent_inside_root!(path)
        parent = path.dirname
        nearest = parent
        nearest = nearest.dirname until nearest.exist? || nearest.to_s == root.to_s

        real_root = root.realpath.to_s
        real_parent = nearest.realpath.to_s
        unless real_parent == real_root || real_parent.start_with?("#{real_root}/")
          raise ToolExecutor::ToolError, "path parent escapes the repository root"
        end
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

      def test_command(target, args)
        if target == "rails_file"
          path = args[:path].to_s
          raise ToolExecutor::ToolError, "path is required for rails_file target" if path.blank?
          raise ToolExecutor::ToolError, "rails_file path must be under test/" unless path.start_with?("test/")
          safe_path(path)
          return ["bundle", "exec", "rails", "test", path]
        end

        TEST_COMMANDS.fetch(target) do
          raise ToolExecutor::ToolError, "Unknown test target. Use one of: #{(TEST_COMMANDS.keys + ["rails_file"]).join(", ")}"
        end
      end

      def run_with_timeout(command, timeout_seconds)
        timed_out = false
        output = error = status = nil
        Timeout.timeout(timeout_seconds) do
          output, error, status = run(*command)
        end
        [output, error, status, timed_out]
      rescue Timeout::Error
        timed_out = true
        ["", "Command timed out after #{timeout_seconds} seconds", nil, timed_out]
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
