# frozen_string_literal: true

module PdfMaster
  class Converter
    class << self

      def image_to_pdf(image_paths, output_pdf)
        Logger.log("Converting images #{image_paths} to PDF: #{output_pdf}")
        images = Array(image_paths)
        pdf = Prawn::Document.new
        images.each_with_index do |image, index|
          pdf.image image, fit: [500, 700]
          pdf.start_new_page unless index == images.length - 1
        end
        pdf.render_file(output_pdf)
        Logger.log("Image to PDF conversion completed: #{output_pdf}")
      end

      def pdf_to_images(input_pdf, output_folder)
        Logger.log("Converting PDF #{input_pdf} to images in #{output_folder}")

        # Ensure the output folder exists
        Dir.mkdir(output_folder) unless Dir.exist?(output_folder)
      
        # Construct the command using `pdftoppm` (part of Poppler)
        output_prefix = File.join(output_folder, "page")
        command = "pdftoppm -png #{Shellwords.escape(input_pdf)} #{Shellwords.escape(output_prefix)}"

        unless system('which pdftoppm > /dev/null 2>&1')
          Logger.log('pdftoppm not found in PATH')
          raise 'pdftoppm command is required for PDF to image conversion'
        end

        success = system(command)

        if success
          Logger.log("Successfully converted PDF pages to images in #{output_folder}")
        else
          Logger.log('Error converting PDF to images.')
          raise 'PDF to Image conversion failed.'
        end
      end

      def extract_images(input_pdf, output_folder)
        Logger.log("Extracting images from PDF: #{input_pdf}")
        pdf = HexaPDF::Document.open(input_pdf)
        image_index = 1

        pdf.pages.each_with_index do |page, page_number|
          xobjects = page.resources[:XObject] || {}
          xobjects.each do |name, stream|
            next unless stream[:Subtype] == :Image

            # Determine the image filter
            filter = stream[:Filter]
            extension = case filter
                        when :DCTDecode then 'jpg'  # JPEG images
                        when :JPXDecode then 'jp2' # JPEG2000 images
                        when :CCITTFaxDecode then 'tiff' # CCITT images
                        when :JBIG2Decode then 'jb2' # JBIG2 images
                        else 'png' # Default to PNG for other types
                        end

            image_path = File.join(output_folder, "page_#{page_number + 1}_image_#{image_index}.#{extension}")

            # Write the image data to a file
            File.open(image_path, 'wb') { |f| f.write(stream.stream) }
            Logger.log("Extracted image saved: #{image_path}")
            image_index += 1
          end
        end
      rescue => e
        Logger.log("Error extracting images: #{e.message}")
        raise
      end

      def html_file_to_pdf(file_path, output_path = nil)
        html_content = File.read(file_path)

        kit = PDFKit.new(html_content, page_size: 'A4')
        pdf = kit.to_pdf

        if output_path
          File.open(output_path, 'wb') { |file| file.write(pdf) }
        end
      end
    end
  end
end
