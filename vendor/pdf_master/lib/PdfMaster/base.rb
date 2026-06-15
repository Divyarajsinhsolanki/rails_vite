# frozen_string_literal: true

require_relative 'utilities'

module PdfMaster
  class Base
    extend Utilities

    class << self
      def generate_overlay_pdf(temp_pdf, page_size: 'A4', &block)
        Prawn::Document.generate(temp_pdf, page_size: page_size) do |pdf|
          block.call(pdf)
        end
      end

      def merge_and_save(original_pdf, target_page, temp_pdf, output_path)
        overlay_pdf = CombinePDF.load(temp_pdf)
        target_page << overlay_pdf.pages.first
        original_pdf.save(output_path)
        File.delete(temp_pdf) if File.exist?(temp_pdf)
      end

      def process_pdf(pdf_path, prefix, page, output_path: nil)
        output_path ||= file_path_with_prefix(pdf_path, prefix)
        temp_pdf = temp_file_path(prefix, pdf_path)

        original_pdf = CombinePDF.load(pdf_path)
        page_number = Integer(page)
        unless page_number.between?(1, original_pdf.pages.count)
          raise ArgumentError, "Invalid page number"
        end
        target_page = original_pdf.pages[page_number - 1]
        
        # Detect page size from mediabox
        width = target_page.mediabox[2] - target_page.mediabox[0]
        height = target_page.mediabox[3] - target_page.mediabox[1]
        page_size = [width, height]

        yield(target_page, temp_pdf, page_size) if block_given?
        merge_and_save(original_pdf, target_page, temp_pdf, output_path)
        output_path
      ensure
        FileUtils.rm_f(temp_pdf) if defined?(temp_pdf) && temp_pdf
      end

      # Font Settings
      def default_font_settings
        { family: 'Helvetica', size: 12, style: :normal, color: '000000' }
      end

      def watermark_font_settings
        { family: 'Helvetica', size: 50, style: :normal, color: 'CCCCCC' }
      end

      def annotation_font_settings
        { family: 'Times-Roman', size: 12, style: :italic, color: 'FF0000' }
      end

      # Apply font settings to Prawn PDF
      def apply_font(pdf, settings = {})
        settings = default_font_settings.merge(settings)  # Merge custom settings with defaults
        pdf.font(settings[:family], style: settings[:style])  # Apply the font with style
        pdf.fill_color(settings[:color])  # Set the text color
        pdf.font_size(settings[:size])  # Set the font size
      end           
    end
  end
end
