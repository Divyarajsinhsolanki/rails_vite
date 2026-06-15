# frozen_string_literal: true

require_relative 'logger'

module PdfMaster
  class Editor < Base
    class << self
      def add_received_stamp(pdf_path, name = 'Received', x = nil, y = nil, page = 1, position = nil, degree = 0, rotate_direction = 'right', font_settings = {})
        Logger.log("Adding received stamp")
      
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
          Logger.log_exception("Adding received stamp", e)
          raise
        end
      end
      

      def add_image(pdf_path, image_path, x = nil, y = nil, page = 1, position = nil, image_settings = {})
        Logger.log("Adding image")
        width = image_settings[:width] || 120
        output_path = process_pdf(pdf_path, image_settings[:prefix] || 'image', page) do |target_page, temp_pdf, page_size|
          x, y = calculate_position(position, target_page.mediabox[2], target_page.mediabox[3], x, y)
          generate_overlay_pdf(temp_pdf, page_size: page_size) do |pdf|
            pdf.image image_path, at: [x, y], width: width
          end
        end
        Logger.log("Image added successfully.")
        output_path
      rescue => e
        Logger.log_exception("Adding image", e)
        raise
      end

      def add_signature(pdf_path, signature_path, x = nil, y = nil, page = 1, position = nil, image_settings = {})
        add_image(pdf_path, signature_path, x, y, page, position, { prefix: 'signature', width: 160 }.merge(image_settings))
      end

      def add_stamp(pdf_path, stamp_path, x = nil, y = nil, page = 1, position = nil, image_settings = {})
        add_image(pdf_path, stamp_path, x, y, page, position, { prefix: 'stamp', width: 120 }.merge(image_settings))
      end

      def add_text(pdf_path, text, x = nil, y = nil, page = 1, position = nil, font_settings = {})
        Logger.log("Adding text")
        output_path = process_pdf(pdf_path, 'text', page) do |target_page, temp_pdf, page_size|
          x, y = calculate_position(position, target_page.mediabox[2], target_page.mediabox[3], x, y)
          generate_overlay_pdf(temp_pdf, page_size: page_size) do |pdf|
            apply_font(pdf, font_settings)  # Apply custom or default font settings
            pdf.text_box(
              text,
              at: [x, y],
              width: font_settings[:width] || 360,
              height: font_settings[:height] || 160,
              overflow: :shrink_to_fit
            )
          end
        end
        Logger.log("Text added successfully.")
        output_path
      rescue => e
        Logger.log_exception("Adding text", e)
        raise
      end

      def add_shapes(pdf_path, shapes_by_page, output_path: nil)
        output_path ||= file_path_with_prefix(pdf_path, "annotations")
        source = CombinePDF.load(pdf_path)

        shapes_by_page.each do |page_number, shapes|
          page_number = Integer(page_number)
          unless page_number.between?(1, source.pages.count)
            raise ArgumentError, "Invalid page number"
          end
          target_page = source.pages[page_number - 1]

          width = target_page.mediabox[2].to_f - target_page.mediabox[0].to_f
          height = target_page.mediabox[3].to_f - target_page.mediabox[1].to_f
          overlay_path = temp_file_path("annotations", pdf_path)

          generate_overlay_pdf(overlay_path, page_size: [width, height]) do |pdf|
            Array(shapes).each { |shape| draw_shape(pdf, shape) }
          end
          target_page << CombinePDF.load(overlay_path).pages.first
          FileUtils.rm_f(overlay_path)
        end

        source.save(output_path)
        output_path
      ensure
        FileUtils.rm_f(overlay_path) if defined?(overlay_path) && overlay_path
      end

      def add_watermark(pdf_path, watermark_text, x = nil, y = nil, page = 1, position = nil, font_settings = {})
        Logger.log("Adding watermark")
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
        Logger.log_exception("Adding watermark", e)
        raise
      end

      def add_annotation(pdf_path, text, x = nil, y = nil, page = 1, position = nil, font_settings = {})
        Logger.log("Adding annotation")
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
        Logger.log_exception("Adding annotation", e)
        raise
      end

      def add_hyperlink(pdf_path, link_text, url, x, y, page, font_settings = {})
        Logger.log("Adding hyperlink")
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
        Logger.log("Adding header and footer")
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
        Logger.log("Redacting text")

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

      def draw_shape(pdf, raw_shape)
        shape = raw_shape.transform_keys(&:to_sym)
        type = shape[:type].to_s
        color = shape[:color].to_s.delete_prefix("#")
        color = "111827" if color.empty?
        fill_color = shape[:fill_color].to_s.delete_prefix("#")
        fill_color = nil if fill_color.empty?
        stroke_width = [[shape[:stroke_width].to_f, 0.5].max, 20].min
        x = shape[:x].to_f
        y = shape[:y].to_f
        width = shape[:width].to_f
        height = shape[:height].to_f

        pdf.stroke_color(color)
        pdf.line_width(stroke_width)

        case type
        when "text", "watermark"
          apply_font(pdf, size: shape[:font_size].to_f.clamp(8, 96), color: color)
          draw_text = lambda do
            pdf.text_box(shape[:text].to_s, at: [x, y], width: [width, 1].max,
                         height: [height, 1].max, overflow: :shrink_to_fit)
          end
          type == "watermark" ? pdf.transparent(shape[:opacity].to_f.clamp(0.05, 1.0), &draw_text) : draw_text.call
        when "highlight"
          pdf.transparent(shape[:opacity].to_f.clamp(0.05, 1.0)) do
            pdf.fill_color(fill_color || color)
            pdf.fill_rectangle([x, y], width, height)
          end
        when "rectangle"
          pdf.fill_color(fill_color) if fill_color
          fill_color ? pdf.fill_and_stroke_rectangle([x, y], width, height) :
                       pdf.stroke_rectangle([x, y], width, height)
        when "arrow"
          x2 = shape[:x2].to_f
          y2 = shape[:y2].to_f
          pdf.stroke_line([x, y], [x2, y2])
          angle = Math.atan2(y2 - y, x2 - x)
          head = [10 + stroke_width, 24].min
          pdf.stroke_line([x2, y2], [x2 - head * Math.cos(angle - Math::PI / 6),
                                     y2 - head * Math.sin(angle - Math::PI / 6)])
          pdf.stroke_line([x2, y2], [x2 - head * Math.cos(angle + Math::PI / 6),
                                     y2 - head * Math.sin(angle + Math::PI / 6)])
        when "pen"
          points = Array(shape[:points]).map { |point| [point["x"] || point[:x], point["y"] || point[:y]].map(&:to_f) }
          points.each_cons(2) { |from, to| pdf.stroke_line(from, to) }
        else
          raise ArgumentError, "Unsupported annotation type"
        end
      end

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
