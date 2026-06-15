# frozen_string_literal: true

require_relative 'logger'

module PdfMaster
  class Editor < Base
    class << self
      def add_received_stamp(pdf_path, name = 'Received', x = nil, y = nil, page = 1, position = nil, degree = 0, rotate_direction = 'right', font_settings = {})
        Logger.log("Adding 'Received' stamp to #{pdf_path} on page #{page}")
      
        # Default text for the stamp
        stamp_text = "#{name} - #{Time.now.strftime('%Y-%m-%d %H:%M:%S')}"
      
        begin
          # Process the PDF and target the specific page
          output_path = process_pdf(pdf_path, 'received_stamp', page) do |target_page, temp_pdf, page_size|
            # Calculate position if necessary, fallback to x, y if not provided
            x, y = calculate_position(position, target_page.mediabox[2], target_page.mediabox[3], x, y)
      
            # Adjust rotation direction
            degree = rotate_direction == 'left' ? -degree : degree
      
            # Generate the overlay PDF with the stamp text
            generate_overlay_pdf(temp_pdf, page_size: page_size) do |pdf|
              apply_font(pdf, font_settings)
              
              # Apply rotation and position the text box
              pdf.rotate(degree, origin: [x, y]) do
                pdf.draw_text stamp_text, at: [x, y]
              end
            end
          end
      
          Logger.log("'Received' stamp added successfully.")
          output_path
        rescue => e
          Logger.log("Error adding 'Received' stamp: #{e.message}")
          raise
        end
      end
      

      def add_image(pdf_path, image_path, x = nil, y = nil, page = 1, position = nil, image_settings = {})
        Logger.log("Adding image '#{image_path}' to #{pdf_path} on page #{page}")
        width = image_settings[:width] || 120
        output_path = process_pdf(pdf_path, image_settings[:prefix] || 'image', page) do |target_page, temp_pdf, page_size|
          x, y = calculate_position(position, target_page.mediabox[2], target_page.mediabox[3], x, y)
          generate_overlay_pdf(temp_pdf, page_size: page_size) do |pdf|
            pdf.image image_path, at: [x, y], width: width
          end
        end
        Logger.log("Image '#{image_path}' added successfully.")
        output_path
      rescue => e
        Logger.log("Error adding image: #{e.message}")
        raise
      end

      def add_signature(pdf_path, signature_path, x = nil, y = nil, page = 1, position = nil, image_settings = {})
        add_image(pdf_path, signature_path, x, y, page, position, { prefix: 'signature', width: 160 }.merge(image_settings))
      end

      def add_stamp(pdf_path, stamp_path, x = nil, y = nil, page = 1, position = nil, image_settings = {})
        add_image(pdf_path, stamp_path, x, y, page, position, { prefix: 'stamp', width: 120 }.merge(image_settings))
      end

      def add_text(pdf_path, text, x = nil, y = nil, page = 1, position = nil, font_settings = {})
        Logger.log("Adding text to #{pdf_path} on page #{page}")
        output_path = process_pdf(pdf_path, 'text', page) do |target_page, temp_pdf, page_size|
          x, y = calculate_position(position, target_page.mediabox[2], target_page.mediabox[3], x, y)
          generate_overlay_pdf(temp_pdf, page_size: page_size) do |pdf|
            apply_font(pdf, font_settings)  # Apply custom or default font settings
            pdf.draw_text text, at: [x, y]
          end
        end
        Logger.log("Text added successfully.")
        output_path
      rescue => e
        Logger.log("Error adding text: #{e.message}")
        raise
      end

      def add_watermark(pdf_path, watermark_text, x = nil, y = nil, page = 1, position = nil, font_settings = {})
        Logger.log("Adding watermark to #{pdf_path} on page #{page}")
        settings = watermark_font_settings.merge(font_settings)
        output_path = process_pdf(pdf_path, 'watermark', page) do |target_page, temp_pdf, page_size|
          x, y = calculate_position(position, target_page.mediabox[2], target_page.mediabox[3], x, y)
          generate_overlay_pdf(temp_pdf, page_size: page_size) do |pdf|
            apply_font(pdf, settings)
            pdf.transparent(settings[:opacity] || 0.3) do
              pdf.text_box(
                watermark_text,
                at: [x, y],
                size: settings[:size],
                rotate: settings[:rotate] || 45,
                width: settings[:width] || 420,
                height: settings[:height] || 90
              )
            end
          end
        end
        Logger.log("Watermark added successfully.")
        output_path
      rescue => e
        Logger.log("Error adding watermark: #{e.message}")
        raise
      end

      def add_annotation(pdf_path, text, x = nil, y = nil, page = 1, position = nil, font_settings = {})
        Logger.log("Adding annotation to #{pdf_path} on page #{page}")
        output_path = process_pdf(pdf_path, 'annotation', page) do |target_page, temp_pdf, page_size|
          x, y = calculate_position(position, target_page.mediabox[2], target_page.mediabox[3], x, y)
          generate_overlay_pdf(temp_pdf, page_size: page_size) do |pdf|
            apply_font(pdf, font_settings)  # Apply custom or default font settings
            pdf.fill_color 'FF0000'
            pdf.text_box text, at: [x, y], size: 12, style: :italic, width: 200, height: 50
          end
        end
        Logger.log("Annotation added successfully.")
        output_path
      rescue => e
        Logger.log("Error adding annotation: #{e.message}")
        raise
      end

      def replace_text(input_pdf, text_to_remove, replacement_text = "[redacted]")
        Logger.log("Replacing text: '#{text_to_remove}' with '#{replacement_text}' in #{input_pdf}")
        doc = HexaPDF::Document.open(input_pdf)

        doc.pages.each do |page|
          next unless page.contents

          # HexaPDF pages can have multiple content streams
          Array(page.contents).each do |content_stream|
            source = content_stream.stream
            if source.include?(text_to_remove)
              new_source = source.gsub(text_to_remove, replacement_text)
              content_stream.stream = new_source
            end
          end
        end

        doc.write(input_pdf, optimize: true)
        Logger.log("Text replaced successfully with '#{replacement_text}'.")
      rescue => e
        Logger.log("Error replacing text: #{e.message}")
        raise
      end

      def add_hyperlink(pdf_path, link_text, url, x, y, page, font_settings = {})
        Logger.log("Adding hyperlink to #{pdf_path}")
        process_pdf(pdf_path, 'hyperlink', page) do |target_page, temp_pdf|
          generate_overlay_pdf(temp_pdf) do |pdf|
            apply_font(pdf, font_settings)  # Apply custom or default font settings
            pdf.formatted_text_box(
              [{ text: link_text, styles: [:underline], color: '0000FF', link: url }],
              at: [x, y],
              size: 12
            )
          end
        end
        Logger.log("Hyperlink added successfully.")
      end

      def add_header_footer(pdf_path, header, footer, font_settings = {})
        Logger.log("Adding header and footer to #{pdf_path}")
        process_pdf(pdf_path, 'header_footer', 1) do |target_page, temp_pdf|
          generate_overlay_pdf(temp_pdf) do |pdf|
            apply_font(pdf, font_settings)  # Apply custom or default font settings
            pdf.text_box header, at: [10, target_page.mediabox[3] - 20], size: 10
            pdf.text_box footer, at: [10, 10], size: 10
          end
        end
        Logger.log("Header and footer added successfully.")
      end

      def redact_text(pdf_path, text_to_redact)
        Logger.log("Redacting text in #{pdf_path}")

        pdf = HexaPDF::Document.open(pdf_path)

        pdf.pages.each do |page|
          text_positions = extract_text_positions(page)
          
          text_positions.each do |text_fragment|
            if text_fragment[:text].include?(text_to_redact)
              draw_redaction_box(page, text_fragment[:x], text_fragment[:y], text_fragment[:width], text_fragment[:height])
            end
          end
        end

        pdf.write(pdf_path)
        Logger.log("Text redacted successfully.")
      end

      private

      def extract_text_positions(page)
        text_fragments = []
        processor = HexaPDF::Content::Processor.new

        processor.operators['Tj'] = lambda do |_, params|
          # Use current graphics state for position (this is a simplified heuristic)
          matrix = processor.graphics_state.text_matrix
          text_fragments << { text: params[0], x: matrix.e, y: matrix.f, width: 50, height: 10 }
        end

        processor.operators['TJ'] = lambda do |_, params|
          combined_text = params[0].map { |e| e.is_a?(String) ? e : '' }.join
          matrix = processor.graphics_state.text_matrix
          text_fragments << { text: combined_text, x: matrix.e, y: matrix.f, width: 50, height: 10 }
        end

        page.process_contents(processor)
        text_fragments
      end

      def draw_redaction_box(page, x, y, width, height)
        canvas = page.canvas
        canvas.save_graphics_state do
          canvas.fill_color(0, 0, 0)  # Black box
          canvas.rectangle(x, y, width, height).fill
        end
      end
    end
  end
end
