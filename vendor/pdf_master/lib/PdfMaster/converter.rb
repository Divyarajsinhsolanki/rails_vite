# frozen_string_literal: true

require "fileutils"
require "open3"

module PdfMaster
  class Converter
    class << self

      def image_to_pdf(image_paths, output_pdf)
        Logger.log("Converting images to PDF")
        images = Array(image_paths)
        pdf = Prawn::Document.new
        images.each_with_index do |image, index|
          pdf.image image, fit: [500, 700]
          pdf.start_new_page unless index == images.length - 1
        end
        pdf.render_file(output_pdf)
        Logger.log("Image to PDF conversion completed.")
      end

      def pdf_to_images(input_pdf, output_folder)
        Logger.log("Converting PDF to images")
        FileUtils.mkdir_p(output_folder)
        output_prefix = File.join(output_folder, "page")
        _stdout, _stderr, status = Open3.capture3("pdftoppm", "-png", input_pdf, output_prefix)

        if status.success?
          Logger.log("PDF converted to images successfully.")
        else
          Logger.log("PDF to image conversion failed.", :error)
          raise "PDF to image conversion failed."
        end
      rescue Errno::ENOENT
        Logger.log("PDF image converter is unavailable.", :error)
        raise "pdftoppm is required for PDF image conversion."
      end

      def extract_images(input_pdf, output_folder)
        Logger.log("Extracting images from PDF")
        FileUtils.mkdir_p(output_folder)
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
            image_index += 1
          end
        end
        Logger.log("Images extracted successfully.")
      rescue => e
        Logger.log_exception("Extracting images", e)
        raise
      end
    end
  end
end
