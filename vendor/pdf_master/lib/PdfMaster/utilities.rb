# frozen_string_literal: true

require 'fileutils'
require 'securerandom'
require 'tmpdir'

module PdfMaster
  module Utilities
    POSITIONS = {
      'top_right' => ->(w, h) { [w - 110, h - 50] },
      'top_left' => ->(_w, h) { [10, h - 50] },
      'top_center' => ->(w, h) { [(w / 2) - 50, h - 50] },
      'center' => ->(w, h) { [(w / 2) - 50, (h / 2) - 10] },
      'bottom_right' => ->(w, _h) { [w - 110, 50] },
      'bottom_left' => ->(_w, _h) { [10, 50] },
      'bottom_center' => ->(w, _h) { [(w / 2) - 50, 50] }
    }.freeze

    def operation_directory(pdf_path)
      directory = File.join(File.dirname(File.expand_path(pdf_path)), "pdf_master_tmp")
      FileUtils.mkdir_p(directory)
      directory
    end

    def file_path_with_prefix(pdf_path, prefix)
      stem = File.basename(pdf_path, File.extname(pdf_path))
      File.join(File.dirname(File.expand_path(pdf_path)), "#{prefix}_#{SecureRandom.hex(10)}_#{stem}.pdf")
    end

    def temp_file_path(prefix, pdf_path = Dir.tmpdir)
      directory = File.directory?(pdf_path) ? pdf_path : operation_directory(pdf_path)
      File.join(directory, "#{prefix}_#{SecureRandom.hex(10)}.pdf")
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
