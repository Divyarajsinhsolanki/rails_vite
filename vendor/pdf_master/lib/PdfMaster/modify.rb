# frozen_string_literal: true

require_relative 'logger'

module PdfMaster
  class Modify
    class << self
      attr_accessor :pdf, :pdf_pages

      def load_pdf(input_pdf)
        @pdf = CombinePDF.load(input_pdf)
        @pdf_pages = @pdf.pages
      end

      def save_pdf(output_pdf)
        output_pdf = output_pdf.dup if output_pdf.frozen?
        begin
          @pdf.save(output_pdf)
        rescue RuntimeError => e
          Logger.log("Error saving PDF: #{e.message}")
          raise
        end
      end

      def add_page(input_pdf, *page_numbers)
        Logger.log("Adding blank pages to #{input_pdf} at positions #{page_numbers}")
        positions = normalize_page_numbers(page_numbers)
        raise ArgumentError, "Choose at least one page position." if positions.empty?

        pdf = CombinePDF.load(input_pdf)
        validate_positions!(positions, pdf.pages.count + 1, "position")

        new_pdf = insert_blank_pages(pdf, positions)
        new_pdf.save(input_pdf)
        Logger.log("Blank pages added successfully.")
      rescue => e
        Logger.log("Error adding pages: #{e.message}")
        raise
      end

      def add_blank_page_like(input_pdf, position, reference_page_number = nil, output_pdf = input_pdf)
        Logger.log("Adding blank page to #{input_pdf} at position #{position}")
        pdf = CombinePDF.load(input_pdf)
        insert_position = Integer(position)
        validate_positions!([insert_position], pdf.pages.count + 1, "position")

        reference_index = blank_page_reference_index(pdf, insert_position, reference_page_number)
        blank_page = build_blank_page_like(pdf.pages[reference_index])
        new_pdf = CombinePDF.new

        pdf.pages.each_with_index do |page, index|
          new_pdf << blank_page if insert_position == index + 1
          new_pdf << page
        end
        new_pdf << blank_page if insert_position == pdf.pages.count + 1

        new_pdf.save(output_pdf)
        Logger.log("Blank page added successfully.")
      rescue => e
        Logger.log("Error adding blank page: #{e.message}")
        raise
      end

      def remove_page(input_pdf, *page_numbers)
        delete_pages(input_pdf, page_numbers, input_pdf)
      end

      def delete_pages(input_pdf, page_numbers, output_pdf = input_pdf)
        Logger.log("Removing pages #{page_numbers} from #{input_pdf}")
        pages_to_delete = normalize_page_numbers(page_numbers)
        raise ArgumentError, "Choose at least one page to delete." if pages_to_delete.empty?

        pdf = CombinePDF.load(input_pdf)
        validate_positions!(pages_to_delete, pdf.pages.count, "page")
        raise ArgumentError, "A PDF must keep at least one page." if pages_to_delete.length >= pdf.pages.count

        new_pdf = CombinePDF.new
        pdf.pages.each_with_index do |page, index|
          new_pdf << page unless pages_to_delete.include?(index + 1)
        end

        new_pdf.save(output_pdf)
        Logger.log("Pages #{pages_to_delete} removed successfully.")
      rescue => e
        Logger.log("Error removing pages: #{e.message}")
        raise
      end

      def rotate_page(input_pdf, degrees, *page_numbers)
        rotate_pages(input_pdf, page_numbers, degrees, input_pdf)
      end

      def rotate_pages(input_pdf, page_numbers, degrees, output_pdf = input_pdf)
        Logger.log("Rotating pages #{page_numbers} of #{input_pdf} by #{degrees} degrees")
        rotation = Integer(degrees)
        raise ArgumentError, "Rotation must be a multiple of 90 degrees." unless (rotation % 90).zero?

        pages_to_rotate = normalize_page_numbers(page_numbers)
        raise ArgumentError, "Choose at least one page to rotate." if pages_to_rotate.empty?

        pdf = CombinePDF.load(input_pdf)
        validate_positions!(pages_to_rotate, pdf.pages.count, "page")

        pages_to_rotate.each do |page_number|
          page = pdf.pages[page_number - 1]
          current_rotation = (page[:Rotate] || 0).to_i
          page[:Rotate] = (current_rotation + rotation) % 360
        end

        pdf.save(output_pdf)
        Logger.log("Pages rotated successfully.")
      rescue => e
        Logger.log("Error rotating pages: #{e.message}")
        raise
      end

      def duplicate_pages(input_pdf, *page_numbers)
        Logger.log("Duplicating pages #{page_numbers} in #{input_pdf}")

        doc = HexaPDF::Document.open(input_pdf)
        max_pages = doc.pages.count
        valid_positions = page_numbers.map(&:to_i).uniq.select { |pos| pos.between?(1, max_pages) }

        return if valid_positions.empty?

        valid_positions.sort.reverse.each do |page_number|
          page_index = page_number - 1
          original_page = doc.pages[page_index]

          # Correctly duplicate using `doc.import`
          duplicated_page = doc.import(original_page)

          # Insert the duplicated page right after the original
          doc.pages.insert(page_index + 1, duplicated_page)
        end

        doc.write(input_pdf, optimize: true)
        Logger.log("Pages duplicated successfully.")
      rescue => e
        Logger.log("Error duplicating pages: #{e.message}")
        raise
      end

      def duplicate_and_place(input_pdf, page_number, target_position, count = 1, doc = nil)
        Logger.log("Duplicating page #{page_number} and placing #{count} copies at position #{target_position} in #{input_pdf}")

        doc_opened_here = doc.nil?
        doc ||= HexaPDF::Document.open(input_pdf)
        max_pages = doc.pages.count
        return unless page_number.between?(1, max_pages)

        page_index = page_number - 1
        target_index = [[target_position - 1, max_pages].min, 0].max

        original_page = doc.pages[page_index]

        count.times do
          duplicated_page = doc.import(original_page) # Import avoids extra blank pages
          doc.pages.insert(target_index, duplicated_page)
          target_index += 1 # Adjust index dynamically to maintain order
        end

        if doc_opened_here
          doc.write(input_pdf, optimize: true)
          Logger.log("Successfully duplicated page #{page_number} and inserted at position #{target_position} #{count} times.")
        end
      rescue => e
        Logger.log("Error in duplication: #{e.message}")
        raise
      end

      def merge_pdfs(output_pdf, *input_pdfs)
        raise ArgumentError, "No input PDFs provided." if input_pdfs.empty?
      
        Logger.log("Merging PDFs into #{output_pdf}: #{input_pdfs.join(', ')}")
      
        combined_pdf = CombinePDF.new
      
        input_pdfs.each do |file|
          unless File.exist?(file) && File.readable?(file)
            raise ArgumentError, "File does not exist or is not readable: #{file}"
          end
      
          begin
            combined_pdf << CombinePDF.load(file)
          rescue => e
            Logger.log("Error loading file #{file}: #{e.message}")
            raise "Failed to load PDF: #{file}"
          end
        end
      
        begin
          combined_pdf.save(output_pdf)
          Logger.log("PDFs merged successfully into #{output_pdf}.")
        rescue => e
          Logger.log("Error saving merged PDF: #{e.message}")
          raise "Failed to save merged PDF."
        end
      end

      def split_pdf(input_pdf, split_page)
        Logger.log("Splitting #{input_pdf} at page #{split_page}")
      
        doc = HexaPDF::Document.open(input_pdf)
        total_pages = doc.pages.count
      
        raise ArgumentError, "Split page #{split_page} is out of range. Total pages: #{total_pages}" if split_page <= 0 || split_page > total_pages
      
        timestamp = Time.now.to_i
        output_dir = defined?(Rails) ? Rails.root.join('public', 'uploads') : 'public/uploads'
        FileUtils.mkdir_p(output_dir) unless Dir.exist?(output_dir)

        output_pdf1 = File.join(output_dir, "#{File.basename(input_pdf, '.pdf')}_part1_#{timestamp}.pdf")
        output_pdf2 = File.join(output_dir, "#{File.basename(input_pdf, '.pdf')}_part2_#{timestamp}.pdf")
      
        # Create new PDF documents
        doc1 = HexaPDF::Document.new
        doc2 = HexaPDF::Document.new
      
        # Copy pages into the new documents while preserving contents
        (0...split_page).each do |i|
          new_page = doc1.import(doc.pages[i]) # Properly import page
          doc1.pages.add(new_page)
        end
      
        (split_page...total_pages).each do |i|
          new_page = doc2.import(doc.pages[i]) # Properly import page
          doc2.pages.add(new_page)
        end
      
        # Write output PDFs
        doc1.write(output_pdf1, optimize: true)
        doc2.write(output_pdf2, optimize: true)
      
        Logger.log("PDF split successfully into #{output_pdf1} and #{output_pdf2}")
      
        return output_pdf1, output_pdf2
      rescue => e
        Logger.log("Error splitting PDF: #{e.message}")
        raise
      end

      def extract_pages(input_pdf, page_numbers, output_pdf)
        Logger.log("Extracting pages #{page_numbers.join(', ')} from #{input_pdf}")
        
        doc = CombinePDF.load(input_pdf)
        extracted = CombinePDF.new
        
        page_numbers.each do |page_number|
          extracted << doc.pages[page_number - 1] if page_number.between?(1, doc.pages.count)
        end
        
        extracted.save(output_pdf)
        Logger.log("Pages extracted successfully into #{output_pdf}")
      rescue => e
        Logger.log("Error extracting pages: #{e.message}")
        raise
      end

      def reorder_pages(input_pdf, page_order, output_pdf = input_pdf)
        Logger.log("Reordering pages in #{input_pdf} with order #{page_order}")
        pdf = CombinePDF.load(input_pdf)
        order = normalize_page_numbers(page_order)
        expected = (1..pdf.pages.count).to_a

        unless order.sort == expected
          raise ArgumentError, "Page order must include each page exactly once."
        end

        new_pdf = CombinePDF.new
        order.each { |page_number| new_pdf << pdf.pages[page_number - 1] }
        new_pdf.save(output_pdf)
        Logger.log("Pages reordered successfully.")
      rescue => e
        Logger.log("Error reordering pages: #{e.message}")
        raise
      end

      ACTIONS = {
        move_up: ->(pages, *indices) { move_pages(pages, indices, -1) },
        move_down: ->(pages, *indices) { move_pages(pages, indices, +1) },
        move_first: ->(pages, *indices) { move_pages(pages, indices, :first) },
        move_last: ->(pages, *indices) { move_pages(pages, indices, :last) },
        swap: ->(pages, index1, index2) { pages[index1 - 1], pages[index2 - 1] = pages[index2 - 1], pages[index1 - 1] },
        move_to: ->(pages, from, to) { pages.insert(to - 1, pages.delete_at(from - 1)) }
      }.freeze

      def rearrange_pages(input_pdf, action, *args)
        Logger.log("Rearranging pages in #{input_pdf} using action: #{action} with args: #{args}")

        raise ArgumentError, "Invalid action" unless ACTIONS.key?(action)

        load_pdf(input_pdf)

        begin
          ACTIONS[action].call(@pdf_pages, *args)

          @pdf = CombinePDF.new
          @pdf_pages.each { |page| @pdf << page }

          save_pdf(input_pdf)
          Logger.log("Successfully rearranged pages.")
        rescue => e
          Logger.log("Error rearranging pages: #{e.message}")
          raise
        end
      end

      def encrypt_pdf(input_pdf, output_pdf, password)
        Logger.log("Encrypting #{input_pdf} with a password")

        doc = HexaPDF::Document.open(input_pdf)
        doc.encrypt(:owner_password => password, :user_password => password)
        doc.write(output_pdf)

        Logger.log("PDF encrypted successfully: #{output_pdf}")
      rescue => e
        Logger.log("Error encrypting PDF: #{e.message}")
        raise
      end

      def compress_pdf(input_pdf, output_pdf = input_pdf)
        Logger.log("Compressing #{input_pdf}")

        doc = HexaPDF::Document.open(input_pdf)
        doc.write(output_pdf, optimize: true)

        Logger.log("PDF compressed successfully: #{output_pdf}")
      rescue => e
        Logger.log("Error compressing PDF: #{e.message}")
        raise
      end

      def crop_page(input_pdf, page_number, left, bottom, width, height)
        Logger.log("Cropping page #{page_number} of #{input_pdf}")

        doc = HexaPDF::Document.open(input_pdf)
        raise ArgumentError, "Invalid page number" unless page_number.between?(1, doc.pages.count)

        right  = left + width
        top    = bottom + height
        doc.pages[page_number - 1].box(:crop, [left, bottom, right, top])
        doc.write(input_pdf, optimize: true)

        Logger.log("Page cropped successfully.")
      rescue => e
        Logger.log("Error cropping page: #{e.message}")
        raise
      end

      def add_page_numbers(input_pdf, start_number = 1, font_settings = {})
        Logger.log("Adding page numbers to #{input_pdf}")

        doc = CombinePDF.load(input_pdf)
        doc.pages.each_with_index do |page, index|
          number = start_number + index
          width  = page.mediabox[2]
          height = page.mediabox[3]
          temp_pdf = File.join(Utilities::UPLOADS_DIR, "temp_pn_#{index}.pdf")

          Base.generate_overlay_pdf(temp_pdf) do |pdf|
            Base.apply_font(pdf, font_settings)
            x, y = Base.calculate_position('bottom_center', width, height)
            pdf.draw_text number.to_s, at: [x, y]
          end

          page << CombinePDF.load(temp_pdf).pages.first
          File.delete(temp_pdf) if File.exist?(temp_pdf)
        end

        doc.save(input_pdf)
        Logger.log('Page numbers added successfully.')
      rescue => e
        Logger.log("Error adding page numbers: #{e.message}")
        raise
      end

      def update_metadata(input_pdf, metadata = {})
        Logger.log("Updating metadata for #{input_pdf}")

        doc = HexaPDF::Document.open(input_pdf)
        info = doc.trailer.info
        metadata.each { |key, value| info[key.to_sym] = value }
        doc.write(input_pdf, optimize: true)

        Logger.log('Metadata updated successfully.')
      rescue => e
        Logger.log("Error updating metadata: #{e.message}")
        raise
      end

      def remove_metadata(input_pdf)
        Logger.log("Removing metadata from #{input_pdf}")

        doc = HexaPDF::Document.open(input_pdf)
        doc.trailer.info.clear
        doc.write(input_pdf, optimize: true)

        Logger.log('Metadata removed successfully.')
      rescue => e
        Logger.log("Error removing metadata: #{e.message}")
        raise
      end

      def flatten_form_fields(input_pdf)
        Logger.log("Flattening form fields in #{input_pdf}")

        doc = HexaPDF::Document.open(input_pdf)
        doc.acro_form&.form_fields&.each(&:flatten)
        doc.write(input_pdf, optimize: true)

        Logger.log('Form fields flattened successfully.')
      rescue => e
        Logger.log("Error flattening form fields: #{e.message}")
        raise
      end

      def change_orientation(input_pdf, orientation = :portrait)
        Logger.log("Changing orientation of #{input_pdf} to #{orientation}")

        rotate = orientation.to_sym == :landscape ? 90 : 0
        doc = HexaPDF::Document.open(input_pdf)
        doc.pages.each do |page|
          page[:Rotate] = rotate
        end
        doc.write(input_pdf, optimize: true)

        Logger.log('Orientation changed successfully.')
      rescue => e
        Logger.log("Error changing orientation: #{e.message}")
        raise
      end

      private

      def normalize_page_numbers(values)
        Array(values).flatten.map { |value| Integer(value) }.uniq
      end

      def validate_positions!(positions, max_position, label)
        invalid = positions.reject { |position| position.between?(1, max_position) }
        return if invalid.empty?

        raise ArgumentError, "Invalid #{label} numbers: #{invalid.join(', ')}"
      end

      def insert_blank_pages(pdf, positions)
        sorted_positions = positions.sort
        new_pdf = CombinePDF.new
        insert_index = 0

        pdf.pages.each_with_index do |page, index|
          while insert_index < sorted_positions.size && sorted_positions[insert_index] == index + 1
            new_pdf << build_default_blank_page
            insert_index += 1
          end
          new_pdf << page
        end

        while insert_index < sorted_positions.size && sorted_positions[insert_index] == pdf.pages.count + 1
          new_pdf << build_default_blank_page
          insert_index += 1
        end

        new_pdf
      end

      def blank_page_reference_index(pdf, insert_position, reference_page_number)
        reference = if reference_page_number.nil? || reference_page_number.to_s.strip.empty?
                      [insert_position - 1, 1].max
                    else
                      Integer(reference_page_number)
                    end
        reference = [[reference, 1].max, pdf.pages.count].min
        reference - 1
      end

      def build_default_blank_page
        CombinePDF.parse(String.new(Prawn::Document.new.render).dup).pages.first
      end

      def build_blank_page_like(reference_page)
        box = Array(reference_page&.mediabox)
        width = (box[2] || 612).to_f - (box[0] || 0).to_f
        height = (box[3] || 792).to_f - (box[1] || 0).to_f
        width = 612 if width <= 0
        height = 792 if height <= 0

        blank_pdf = Prawn::Document.new(page_size: [width, height], margin: 0)
        CombinePDF.parse(String.new(blank_pdf.render).dup).pages.first
      end

      def move_pages(pages, indices, direction)
        # Convert to 0-based indices and sort them to keep extraction predictable
        target_indices = indices.map { |i| i - 1 }.sort
        
        # Extract the pages to be moved
        moved_pages = target_indices.reverse.map { |i| pages.delete_at(i) }.reverse
        
        case direction
        when -1 # Move Up
          # Find the new insertion point based on the first selected page
          new_pos = [target_indices.first - 1, 0].max
          pages.insert(new_pos, *moved_pages)
        when +1 # Move Down
          # New pos is after the last selected page's original position (shifted by deletion)
          new_pos = [target_indices.first + 1, pages.size].min
          pages.insert(new_pos, *moved_pages)
        when :first
          pages.unshift(*moved_pages)
        when :last
          pages.push(*moved_pages)
        end
      end
    end
  end
end
