require "combine_pdf"
require "hexapdf"
require "mini_magick"
require "open3"
require "prawn"
require "timeout"
require "zip"

module PdfDocuments
  class Processor
    MAX_SHAPES = 200
    MAX_PEN_POINTS = 2_000
    MAX_REDACTIONS = 100
    MAX_TEXT_LENGTH = 5_000
    MAX_PAGES = 2_000
    ANNOTATION_TYPES = %w[text watermark highlight rectangle arrow pen].freeze

    def initialize(document:, user:)
      @document = document
      @user = user
    end

    def edit!(kind:, parameters:, base_version_id:, asset: nil)
      raise ArgumentError, "Unlock this PDF before editing it." if @document.encrypted? && kind.to_s != "unlock"

      with_source do |source_path|
        with_output do |output_path|
          dispatch_edit(kind.to_s, source_path, output_path, parameters.deep_symbolize_keys, asset)
          Manager.append_version!(
            document: @document,
            created_by: @user,
            path: output_path,
            operation: kind,
            base_version_id:
          )
        end
      end
    end

    def protect!(password:, base_version_id:)
      validate_password!(password)
      with_source do |source_path|
        with_output do |output_path|
          document = HexaPDF::Document.open(source_path)
          document.encrypt(owner_password: password, user_password: password,
                           algorithm: :aes, key_length: 256)
          document.write(output_path, optimize: true)
          Manager.append_version!(
            document: @document,
            created_by: @user,
            path: output_path,
            operation: "protect",
            base_version_id:
          )
        end
      end
    end

    def unlock!(password:, base_version_id:)
      with_source do |source_path|
        with_output do |output_path|
          document = HexaPDF::Document.open(source_path, decryption_opts: { password: password })
          document.encrypt(name: nil)
          document.write(output_path, optimize: true)
          Manager.append_version!(
            document: @document,
            created_by: @user,
            path: output_path,
            operation: "unlock",
            base_version_id:
          )
        end
      end
    rescue HexaPDF::EncryptionError
      raise ArgumentError, "The PDF password is incorrect."
    end

    def compress!(base_version_id:)
      with_source do |source_path|
        with_output do |output_path|
          PdfMaster::Modify.compress_pdf(source_path, output_path)
          Manager.append_version!(
            document: @document,
            created_by: @user,
            path: output_path,
            operation: "compress",
            base_version_id:
          )
        end
      end
    end

    def extract_text!
      with_source do |source_path|
        stdout, stderr, status = run_command(
          ["pdftotext", "-layout", "-enc", "UTF-8", source_path, "-"],
          timeout: 90
        )
        raise ArgumentError, "Text extraction failed." unless status.success?

        create_artifact!(
          kind: "text",
          filename: "#{File.basename(@document.original_filename, ".pdf")}.txt",
          content_type: "text/plain",
          content: stdout.encode("UTF-8", invalid: :replace, undef: :replace, replace: "")
        )
      end
    end

    def export_images!
      with_source do |source_path|
        Dir.mktmpdir("pdf-images") do |directory|
          prefix = File.join(directory, "page")
          _stdout, stderr, status = run_command(
            ["pdftoppm", "-png", "-r", "144", source_path, prefix],
            timeout: 120
          )
          raise ArgumentError, "Image export failed." unless status.success?

          image_paths = Dir.glob("#{prefix}-*.png").sort
          raise ArgumentError, "Image export produced no files." if image_paths.empty?

          zip_path = File.join(directory, "images.zip")
          Zip::File.open(zip_path, create: true) do |zip|
            image_paths.each_with_index do |path, index|
              zip.add("page-#{index + 1}.png", path)
            end
          end
          create_artifact_from_path!(
            kind: "images",
            path: zip_path,
            filename: "#{File.basename(@document.original_filename, ".pdf")}-images.zip",
            content_type: "application/zip"
          )
        end
      end
    end

    def redact!(regions:, base_version_id:)
      regions = Array(regions)
      raise ArgumentError, "Too many redaction areas." if regions.length > MAX_REDACTIONS

      grouped = regions.group_by { |region| Integer(region["page_number"] || region[:page_number]) }
      raise ArgumentError, "Draw at least one redaction area." if grouped.empty?

      with_source do |source_path|
        grouped.each_key { |page_number| page_dimensions(source_path, page_number) }
        with_output do |output_path|
          source_pdf = CombinePDF.load(source_path)
          rebuilt = CombinePDF.new

          source_pdf.pages.each_with_index do |page, index|
            page_number = index + 1
            if grouped.key?(page_number)
              rebuilt << rasterized_redacted_page(source_path, page_number, grouped[page_number])
            else
              rebuilt << page
            end
          end
          rebuilt.save(output_path)
          Manager.append_version!(
            document: @document,
            created_by: @user,
            path: output_path,
            operation: "redact",
            base_version_id:
          )
        end
      end
    end

    private

    def dispatch_edit(kind, source_path, output_path, params, asset)
      FileUtils.cp(source_path, output_path)

      case kind
      when "reorder_pages"
        PdfMaster::Modify.reorder_pages(source_path, params.fetch(:page_order), output_path)
      when "delete_pages"
        pages = page_numbers!(params.fetch(:page_numbers))
        raise ArgumentError, "A PDF must keep at least one page." if pages.length >= @document.page_count

        PdfMaster::Modify.delete_pages(source_path, pages, output_path)
      when "rotate_pages"
        pages = page_numbers!(params.fetch(:page_numbers))
        degrees = Integer(params.fetch(:degrees))
        raise ArgumentError, "Rotation must be a multiple of 90 degrees." unless (degrees % 90).zero?

        PdfMaster::Modify.rotate_pages(source_path, pages, degrees, output_path)
      when "duplicate_pages"
        pages = page_numbers!(params.fetch(:page_numbers))
        raise ArgumentError, "The result would contain too many pages." if @document.page_count + pages.length > MAX_PAGES

        PdfMaster::Modify.duplicate_pages(output_path, *pages)
      when "add_blank_page"
        raise ArgumentError, "The result would contain too many pages." if @document.page_count >= MAX_PAGES

        PdfMaster::Modify.add_blank_page_like(source_path, Integer(params.fetch(:position)),
                                              params[:reference_page_number], output_path)
      when "crop"
        crop_page!(output_path, params)
      when "annotations"
        PdfMaster::Editor.add_shapes(source_path, mapped_shapes(source_path, params.fetch(:shapes)),
                                     output_path:)
      when "image"
        add_image!(source_path, output_path, params, asset)
      else
        raise ArgumentError, "Unsupported PDF operation."
      end
    end

    def crop_page!(path, params)
      page_number = Integer(params.fetch(:page_number))
      dimensions = page_dimensions(path, page_number)
      validate_rectangle!(params, display_dimensions(dimensions), label: "Crop")
      mapped = CoordinateMapper.new(**dimensions).rectangle(
        x: params.fetch(:x), y: params.fetch(:y),
        width: params.fetch(:width), height: params.fetch(:height)
      )
      raise ArgumentError, "Crop area is too small." if mapped[:width] < 10 || mapped[:height] < 10

      PdfMaster::Modify.crop_page(path, page_number, mapped[:x], mapped[:bottom],
                                  mapped[:width], mapped[:height])
    end

    def mapped_shapes(path, shapes)
      shapes = Array(shapes)
      raise ArgumentError, "Add at least one annotation." if shapes.empty?
      raise ArgumentError, "Too many annotations." if shapes.length > MAX_SHAPES
      total_points = shapes.sum { |shape| Array(shape["points"] || shape[:points]).length }
      raise ArgumentError, "Pen drawing contains too many points." if total_points > MAX_PEN_POINTS

      shapes.group_by { |shape| Integer(shape["page_number"] || shape[:page_number]) }.transform_values do |page_shapes|
        page_number = Integer(page_shapes.first["page_number"] || page_shapes.first[:page_number])
        dimensions = page_dimensions(path, page_number)
        display = display_dimensions(dimensions)
        mapper = CoordinateMapper.new(**dimensions)

        page_shapes.map do |raw|
          shape = raw.deep_symbolize_keys
          validate_annotation!(shape, display)
          case shape[:type].to_s
          when "pen"
            shape.merge(points: Array(shape[:points]).map do |point|
              x, y = mapper.point(point[:x], point[:y])
              { x:, y: }
            end)
          when "arrow"
            x, y = mapper.point(shape[:x], shape[:y])
            x2, y2 = mapper.point(shape[:x2], shape[:y2])
            shape.merge(x:, y:, x2:, y2:)
          else
            rectangle = mapper.rectangle(x: shape[:x], y: shape[:y],
                                         width: shape[:width], height: shape[:height])
            shape.merge(x: rectangle[:x], y: rectangle[:y],
                        width: rectangle[:width], height: rectangle[:height])
          end
        end
      end
    end

    def add_image!(source_path, output_path, params, asset)
      raise ArgumentError, "Choose a PNG or JPG image." unless asset.respond_to?(:path)
      raise ArgumentError, "Image must be 10MB or smaller." if asset.size.to_i > 10.megabytes
      unless %w[image/png image/jpeg].include?(asset.content_type.to_s)
        raise ArgumentError, "Image must be a PNG or JPG."
      end

      image = MiniMagick::Image.open(asset.path)
      unless image.width.to_i.between?(8, 4000) && image.height.to_i.between?(8, 4000)
        raise ArgumentError, "Image dimensions must be between 8px and 4000px."
      end

      page_number = Integer(params.fetch(:page_number))
      dimensions = page_dimensions(source_path, page_number)
      validate_rectangle!(params, display_dimensions(dimensions), label: "Image")
      mapped = CoordinateMapper.new(**dimensions).rectangle(
        x: params.fetch(:x), y: params.fetch(:y),
        width: params.fetch(:width), height: params.fetch(:height)
      )
      PdfMaster::Editor.add_image(
        source_path, asset.path, mapped[:x], mapped[:y], page_number, nil,
        prefix: "image", width: mapped[:width]
      ).tap { |generated| FileUtils.mv(generated, output_path) }
    end

    def page_dimensions(path, page_number)
      HexaPDF::Document.open(path) do |document|
        unless page_number.to_i.between?(1, document.pages.count)
          raise ArgumentError, "Invalid page number."
        end

        page = document.pages[page_number - 1]

        box = page.box(:media)
        { width: box.width, height: box.height, rotation: (page[:Rotate] || 0) }
      end
    end

    def rasterized_redacted_page(source_path, page_number, regions)
      Dir.mktmpdir("pdf-redaction") do |directory|
        prefix = File.join(directory, "page")
        _stdout, stderr, status = run_command(
          ["pdftoppm", "-f", page_number.to_s, "-l", page_number.to_s, "-singlefile",
           "-png", "-r", "200", source_path, prefix],
          timeout: 120
        )
        raise ArgumentError, "Redaction rendering failed." unless status.success?

        image_path = "#{prefix}.png"
        image = MiniMagick::Image.open(image_path)
        scale = 200.0 / 72.0
        page_dimensions = {
          width: image.width * 72.0 / 200.0,
          height: image.height * 72.0 / 200.0
        }
        image.combine_options do |command|
          command.fill("black")
          command.stroke("black")
          regions.each do |region|
            validate_rectangle!(region, page_dimensions, label: "Redaction")
            x1 = region.fetch("x", region[:x]).to_f * scale
            y1 = region.fetch("y", region[:y]).to_f * scale
            x2 = x1 + region.fetch("width", region[:width]).to_f * scale
            y2 = y1 + region.fetch("height", region[:height]).to_f * scale
            command.draw("rectangle #{x1},#{y1} #{x2},#{y2}")
          end
        end
        image.write(image_path)

        page_width = image.width * 72.0 / 200.0
        page_height = image.height * 72.0 / 200.0
        page_pdf = File.join(directory, "page.pdf")
        Prawn::Document.generate(page_pdf, page_size: [page_width, page_height], margin: 0) do |pdf|
          pdf.image image_path, at: [0, page_height], width: page_width, height: page_height
        end
        CombinePDF.load(page_pdf).pages.first
      end
    end

    def create_artifact!(kind:, filename:, content_type:, content:)
      Tempfile.create(["pdf-artifact-", File.extname(filename)], binmode: true) do |file|
        file.write(content)
        file.flush
        create_artifact_from_path!(kind:, path: file.path, filename:, content_type:)
      end
    end

    def create_artifact_from_path!(kind:, path:, filename:, content_type:)
      artifact = @user.pdf_document_artifacts.create!(
        workspace: @user.workspace,
        pdf_document: @document,
        kind:,
        expires_at: 24.hours.from_now
      )
      artifact.file.attach(
        io: File.open(path, "rb"),
        filename:,
        content_type:,
        identify: false
      )
      PurgePdfDocumentArtifactsJob.set(wait: 24.hours).perform_later
      artifact
    end

    def validate_password!(password)
      raise ArgumentError, "Password must be at least 8 characters." if password.to_s.length < 8
    end

    def page_numbers!(values)
      pages = Array(values).map { |value| Integer(value) }.uniq
      raise ArgumentError, "Choose at least one page." if pages.empty?
      unless pages.all? { |page| page.between?(1, @document.page_count.to_i) }
        raise ArgumentError, "One or more page numbers are invalid."
      end

      pages
    end

    def validate_annotation!(shape, dimensions)
      type = shape[:type].to_s
      raise ArgumentError, "Unsupported annotation type." unless ANNOTATION_TYPES.include?(type)

      validate_color!(shape[:color])
      validate_color!(shape[:fill_color]) if shape[:fill_color].present?

      case type
      when "pen"
        points = Array(shape[:points])
        raise ArgumentError, "Pen drawing needs at least two points." if points.length < 2
        points.each { |point| validate_point!(point, dimensions) }
      when "arrow"
        validate_point!(shape, dimensions)
        validate_point!({ x: shape[:x2], y: shape[:y2] }, dimensions)
      else
        validate_rectangle!(shape, dimensions, label: "Annotation")
      end

      if %w[text watermark].include?(type)
        text = shape[:text].to_s
        raise ArgumentError, "Annotation text is required." if text.blank?
        raise ArgumentError, "Annotation text is too long." if text.length > MAX_TEXT_LENGTH
      end
    end

    def validate_rectangle!(value, dimensions, label:)
      x = finite_number!(value.fetch(:x, value["x"]))
      y = finite_number!(value.fetch(:y, value["y"]))
      width = finite_number!(value.fetch(:width, value["width"]))
      height = finite_number!(value.fetch(:height, value["height"]))
      raise ArgumentError, "#{label} area is too small." if width < 2 || height < 2
      if x.negative? || y.negative? ||
         x + width > dimensions[:width] + 1 ||
         y + height > dimensions[:height] + 1
        raise ArgumentError, "#{label} area must stay inside the page."
      end
    end

    def validate_point!(value, dimensions)
      x = finite_number!(value.fetch(:x, value["x"]))
      y = finite_number!(value.fetch(:y, value["y"]))
      return if x.between?(0, dimensions[:width] + 1) && y.between?(0, dimensions[:height] + 1)

      raise ArgumentError, "Annotation must stay inside the page."
    end

    def validate_color!(color)
      return if color.blank? || color.to_s.match?(/\A#?[0-9a-fA-F]{6}\z/)

      raise ArgumentError, "Annotation color is invalid."
    end

    def finite_number!(value)
      number = Float(value)
      raise ArgumentError, "Coordinates must be finite numbers." unless number.finite?

      number
    rescue TypeError, ArgumentError
      raise ArgumentError, "Coordinates must be valid numbers."
    end

    def display_dimensions(dimensions)
      if [90, 270].include?(dimensions[:rotation].to_i % 360)
        { width: dimensions[:height], height: dimensions[:width] }
      else
        dimensions.slice(:width, :height)
      end
    end

    def with_source(&block)
      raise ArgumentError, "Document has no current PDF." unless @document.current_version&.file&.attached?

      @document.current_version.file.open { |file| block.call(file.path) }
    end

    def with_output
      Tempfile.create(["pdf-output-", ".pdf"], binmode: true) do |file|
        file.close
        yield file.path
      end
    end

    def run_command(command, timeout:)
      Timeout.timeout(timeout) { Open3.capture3(*command) }
    rescue Timeout::Error
      raise ArgumentError, "PDF operation timed out. Try a smaller document."
    end
  end
end
