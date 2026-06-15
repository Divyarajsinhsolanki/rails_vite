# frozen_string_literal: true

require_relative 'logger'

module PdfMaster
  class Modify
    class << self
      def load_pdf(input_pdf)
        CombinePDF.load(input_pdf)
      end

      def add_page(input_pdf, *page_numbers)
        Logger.log("Adding blank pages")
        pdf = load_pdf(input_pdf)
        pdf_pages = pdf.pages

        prawn_pdf = Prawn::Document.new { |pdf| pdf.start_new_page }
        blank_page = CombinePDF.parse(String.new(prawn_pdf.render).dup).pages[0]
        new_pdf = CombinePDF.new

        page_numbers = page_numbers.map(&:to_i).sort.uniq
        max_pages = pdf_pages.count + 1
        valid_positions = page_numbers.select { |pos| pos.between?(1, max_pages) }
        
        insert_index = 0
        pdf.pages.each_with_index do |page, index|
          while insert_index < valid_positions.size && valid_positions[insert_index] - 1 == index
            new_pdf << blank_page
            insert_index += 1
          end
          new_pdf << page
        end

        while insert_index < valid_positions.size && valid_positions[insert_index] == max_pages
          new_pdf << blank_page
          insert_index += 1
        end
        
        new_pdf.save(input_pdf)
        Logger.log("Blank pages added successfully.")
      rescue => e
        Logger.log_exception("Adding pages", e)
        raise
      end

      def remove_page(input_pdf, *page_numbers)
        Logger.log("Removing pages")
        pdf = load_pdf(input_pdf)

        page_numbers = page_numbers.map(&:to_i).sort.uniq
        max_pages = pdf.pages.count
        valid_positions = page_numbers.select { |pos| pos.between?(1, max_pages) }

        if valid_positions.empty?
          raise ArgumentError, "Invalid page numbers: #{page_numbers}"
        end

        new_pdf = CombinePDF.new
        pdf.pages.each_with_index do |page, index|
          new_pdf << page unless valid_positions.include?(index + 1)
        end

        new_pdf.save(input_pdf)
        Logger.log("Pages removed successfully.")
      rescue => e
        Logger.log_exception("Removing pages", e)
        raise
      end

      def rotate_page(input_pdf, degrees, *page_numbers)
        Logger.log("Rotating pages")
        pdf = load_pdf(input_pdf)
        pdf_pages = pdf.pages
      
        page_numbers = page_numbers.map(&:to_i).uniq
        max_pages = pdf_pages.count
        valid_positions = page_numbers.select { |pos| pos.between?(1, max_pages) }
        if valid_positions.empty? || valid_positions.length != page_numbers.length
          raise ArgumentError, "Invalid page numbers"
        end
      
        valid_positions.each do |page_number|
          page = pdf_pages[page_number - 1]
          current_rotation = (page[:Rotate] || 0).to_i
          page[:Rotate] = (current_rotation + degrees) % 360
        end
      
        pdf.save(input_pdf)
        Logger.log("Pages rotated successfully.")
      rescue => e
        Logger.log_exception("Rotating pages", e)
        raise
      end

      def duplicate_pages(input_pdf, *page_numbers)
        Logger.log("Duplicating pages")

        doc = HexaPDF::Document.open(input_pdf)
        max_pages = doc.pages.count
        requested_positions = page_numbers.map(&:to_i).uniq
        valid_positions = requested_positions.select { |pos| pos.between?(1, max_pages) }
        if valid_positions.empty? || valid_positions.length != requested_positions.length
          raise ArgumentError, "Invalid page numbers"
        end

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
        Logger.log_exception("Duplicating pages", e)
        raise
      end

      def duplicate_and_place(input_pdf, page_number, target_position, count = 1, doc = nil)
        Logger.log("Duplicating and placing pages")

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
          Logger.log("Pages duplicated and placed successfully.")
        end
      rescue => e
        Logger.log_exception("Duplicating and placing pages", e)
        raise
      end

      def merge_pdfs(output_pdf, *input_pdfs)
        raise ArgumentError, "No input PDFs provided." if input_pdfs.empty?
      
        Logger.log("Merging #{input_pdfs.length} PDFs")
      
        combined_pdf = CombinePDF.new
      
        input_pdfs.each do |file|
          unless File.exist?(file) && File.readable?(file)
            raise ArgumentError, "File does not exist or is not readable: #{file}"
          end
      
          begin
            combined_pdf << CombinePDF.load(file)
          rescue => e
            Logger.log_exception("Loading a PDF for merge", e)
            raise "Failed to load a PDF for merge."
          end
        end
      
        begin
          combined_pdf.save(output_pdf)
          Logger.log("PDFs merged successfully.")
        rescue => e
          Logger.log_exception("Saving merged PDF", e)
          raise "Failed to save merged PDF."
        end
      end

      def split_pdf(input_pdf, split_page, output_pdf1 = nil, output_pdf2 = nil)
        Logger.log("Splitting PDF")
      
        doc = HexaPDF::Document.open(input_pdf)
        total_pages = doc.pages.count
      
        raise ArgumentError, "Split page #{split_page} is out of range. Total pages: #{total_pages}" if split_page <= 0 || split_page > total_pages
      
        output_pdf1 ||= Utilities.file_path_with_prefix(input_pdf, "part1")
        output_pdf2 ||= Utilities.file_path_with_prefix(input_pdf, "part2")
      
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
      
        Logger.log("PDF split successfully.")
      
        return output_pdf1, output_pdf2
      rescue => e
        Logger.log_exception("Splitting PDF", e)
        raise
      end

      def extract_pages(input_pdf, page_numbers, output_pdf)
        Logger.log("Extracting #{Array(page_numbers).length} pages")
        
        doc = CombinePDF.load(input_pdf)
        extracted = CombinePDF.new
        pages = Array(page_numbers).map(&:to_i).uniq
        if pages.empty? || pages.any? { |page_number| !page_number.between?(1, doc.pages.count) }
          raise ArgumentError, "Invalid page numbers"
        end
        pages.each { |page_number| extracted << doc.pages[page_number - 1] }
        
        extracted.save(output_pdf)
        Logger.log("Pages extracted successfully.")
      rescue => e
        Logger.log_exception("Extracting pages", e)
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
        Logger.log("Rearranging pages")

        raise ArgumentError, "Invalid action" unless ACTIONS.key?(action)

        pdf = load_pdf(input_pdf)
        pdf_pages = pdf.pages

        begin
          ACTIONS[action].call(pdf_pages, *args)

          output = CombinePDF.new
          pdf_pages.each { |page| output << page }

          output.save(input_pdf)
          Logger.log("Successfully rearranged pages.")
        rescue => e
          Logger.log_exception("Rearranging pages", e)
          raise
        end
      end

      def encrypt_pdf(input_pdf, output_pdf, password)
        Logger.log("Encrypting PDF")

        doc = HexaPDF::Document.open(input_pdf)
        doc.encrypt(:owner_password => password, :user_password => password)
        doc.write(output_pdf)

        Logger.log("PDF encrypted successfully.")
      rescue => e
        Logger.log_exception("Encrypting PDF", e)
        raise
      end

      def compress_pdf(input_pdf, output_pdf = input_pdf)
        Logger.log("Compressing PDF")

        doc = HexaPDF::Document.open(input_pdf)
        doc.write(output_pdf, optimize: true)

        Logger.log("PDF compressed successfully.")
      rescue => e
        Logger.log_exception("Compressing PDF", e)
        raise
      end

      def crop_page(input_pdf, page_number, left, bottom, width, height)
        Logger.log("Cropping page")

        doc = HexaPDF::Document.open(input_pdf)
        raise ArgumentError, "Invalid page number" unless page_number.between?(1, doc.pages.count)

        right  = left + width
        top    = bottom + height
        doc.pages[page_number - 1].box(:crop, [left, bottom, right, top])
        doc.write(input_pdf, optimize: true)

        Logger.log("Page cropped successfully.")
      rescue => e
        Logger.log_exception("Cropping page", e)
        raise
      end

      def reorder_pages(input_pdf, ordered_page_numbers, output_pdf = input_pdf)
        pdf = CombinePDF.load(input_pdf)
        order = Array(ordered_page_numbers).map(&:to_i)
        expected = (1..pdf.pages.count).to_a
        raise ArgumentError, "Page order must include each page exactly once" unless order.sort == expected

        output = CombinePDF.new
        order.each { |number| output << pdf.pages[number - 1] }
        output.save(output_pdf)
        output_pdf
      end

      def delete_pages(input_pdf, page_numbers, output_pdf = input_pdf)
        pages = Array(page_numbers).map(&:to_i).uniq
        pdf = CombinePDF.load(input_pdf)
        if pages.empty? || pages.any? { |page_number| !page_number.between?(1, pdf.pages.count) }
          raise ArgumentError, "Invalid page numbers"
        end
        raise ArgumentError, "A PDF must keep at least one page" if pages.length >= pdf.pages.count

        output = CombinePDF.new
        pdf.pages.each_with_index { |page, index| output << page unless pages.include?(index + 1) }
        output.save(output_pdf)
        output_pdf
      end

      def rotate_pages(input_pdf, page_numbers, degrees, output_pdf = input_pdf)
        FileUtils.cp(input_pdf, output_pdf) unless File.expand_path(input_pdf) == File.expand_path(output_pdf)
        rotate_page(output_pdf, degrees, *Array(page_numbers))
        output_pdf
      end

      def add_blank_page_like(input_pdf, position, reference_page_number = nil, output_pdf = input_pdf)
        source = CombinePDF.load(input_pdf)
        position = Integer(position)
        raise ArgumentError, "Invalid insertion position" unless position.between?(1, source.pages.count + 1)

        reference_index = [[Integer(reference_page_number || position) - 1, 0].max, source.pages.count - 1].min
        media_box = source.pages[reference_index].mediabox
        width = (media_box[2].to_f - media_box[0].to_f).abs
        height = (media_box[3].to_f - media_box[1].to_f).abs
        blank = CombinePDF.parse(Prawn::Document.new(page_size: [width, height], margin: 0).render).pages.first

        output = CombinePDF.new
        source.pages.each_with_index do |page, index|
          output << blank if index == position - 1
          output << page
        end
        output << blank if position == source.pages.count + 1
        output.save(output_pdf)
        output_pdf
      end

      def add_page_numbers(input_pdf, start_number = 1, font_settings = {})
        Logger.log("Adding page numbers")

        doc = CombinePDF.load(input_pdf)
        doc.pages.each_with_index do |page, index|
          number = start_number + index
          width  = page.mediabox[2]
          height = page.mediabox[3]
          temp_pdf = Utilities.temp_file_path("page_number", input_pdf)

          begin
            Base.generate_overlay_pdf(temp_pdf) do |pdf|
              Base.apply_font(pdf, font_settings)
              x, y = Base.calculate_position('bottom_center', width, height)
              pdf.draw_text number.to_s, at: [x, y]
            end

            page << CombinePDF.load(temp_pdf).pages.first
          ensure
            FileUtils.rm_f(temp_pdf)
          end
        end

        doc.save(input_pdf)
        Logger.log('Page numbers added successfully.')
      rescue => e
        Logger.log_exception("Adding page numbers", e)
        raise
      end

      def update_metadata(input_pdf, metadata = {})
        Logger.log("Updating metadata")

        doc = HexaPDF::Document.open(input_pdf)
        info = doc.trailer.info
        metadata.each { |key, value| info[key.to_sym] = value }
        doc.write(input_pdf, optimize: true)

        Logger.log('Metadata updated successfully.')
      rescue => e
        Logger.log_exception("Updating metadata", e)
        raise
      end

      def remove_metadata(input_pdf)
        Logger.log("Removing metadata")

        doc = HexaPDF::Document.open(input_pdf)
        doc.trailer.info.clear
        doc.write(input_pdf, optimize: true)

        Logger.log('Metadata removed successfully.')
      rescue => e
        Logger.log_exception("Removing metadata", e)
        raise
      end

      def flatten_form_fields(input_pdf)
        Logger.log("Flattening form fields")

        doc = HexaPDF::Document.open(input_pdf)
        doc.acro_form&.form_fields&.each(&:flatten)
        doc.write(input_pdf, optimize: true)

        Logger.log('Form fields flattened successfully.')
      rescue => e
        Logger.log_exception("Flattening form fields", e)
        raise
      end

      def change_orientation(input_pdf, orientation = :portrait)
        Logger.log("Changing page orientation")

        rotate = orientation.to_sym == :landscape ? 90 : 0
        doc = HexaPDF::Document.open(input_pdf)
        doc.pages.each do |page|
          page[:Rotate] = rotate
        end
        doc.write(input_pdf, optimize: true)

        Logger.log('Orientation changed successfully.')
      rescue => e
        Logger.log_exception("Changing page orientation", e)
        raise
      end

      private

      def self.move_pages(pages, indices, direction)
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
