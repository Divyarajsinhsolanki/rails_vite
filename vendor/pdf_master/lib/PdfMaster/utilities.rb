# frozen_string_literal: true

require 'fileutils'

module PdfMaster
  module Utilities
    UPLOADS_DIR = 'public/uploads'.freeze

    POSITIONS = {
      'top_right' => ->(w, h) { [w - 110, h - 50] },
      'top_left' => ->(_w, h) { [10, h - 50] },
      'top_center' => ->(w, h) { [(w / 2) - 50, h - 50] },
      'center' => ->(w, h) { [(w / 2) - 50, (h / 2) - 10] },
      'bottom_right' => ->(w, _h) { [w - 110, 50] },
      'bottom_left' => ->(_w, _h) { [10, 50] },
      'bottom_center' => ->(w, _h) { [(w / 2) - 50, 50] }
    }.freeze

    def ensure_directory
      FileUtils.mkdir_p(UPLOADS_DIR)
    end

    def file_path_with_prefix(pdf_path, prefix)
      "#{UPLOADS_DIR}/#{prefix}_#{File.basename(pdf_path)}"
    end

    def temp_file_path(prefix)
      "#{UPLOADS_DIR}/temp_#{prefix}.pdf"
    end

    def valid_page?(pdf, page)
      page.between?(1, pdf.pages.count)
    end

    def calculate_position(position, width, height, x = nil, y = nil)
      pos_key = position&.to_s
      return POSITIONS[pos_key].call(width, height) if pos_key && POSITIONS.key?(pos_key)
      return [x, y] if x && y

      [0, 0]
    end
  end
end
