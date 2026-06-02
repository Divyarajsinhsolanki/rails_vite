require 'hexapdf'
require 'mini_magick'

class PdfModifiersController < ApplicationController
  MAX_AUXILIARY_UPLOAD_SIZE = 10.megabytes
  MAX_MERGE_UPLOAD_SIZE = 50.megabytes
  DEFAULT_TEXT_FONT_SIZE = 14
  DEFAULT_IMAGE_WIDTH = 160
  ALLOWED_IMAGE_TYPES = {
    '.jpg' => 'image/jpeg',
    '.jpeg' => 'image/jpeg',
    '.png' => 'image/png'
  }.freeze

  def add_text
    path = safe_pdf_path(params[:pdf_path])
    page_number = validated_page_number!(path, params[:page_number])
    x, viewer_y, _page_width, page_height = validated_viewer_coordinates!(path, page_number, params[:x], params[:y])
    font_size = validated_optional_number(params[:font_size], label: 'Font size', min: 8, max: 72) || DEFAULT_TEXT_FONT_SIZE
    color = validated_hex_color(params[:color], fallback: '111827')
    pdf_y = pdf_text_y(page_height, viewer_y, font_size)

    new_path = PdfMaster.add_text(path, required_string!(params[:text], 'Text'), x, pdf_y, page_number, nil, { size: font_size, color: color })
    render_pdf_result('Text added successfully.', new_path, fallback_path: path)
  rescue => e
    render_pdf_error(e)
  end

  def add_page
    path = safe_pdf_path(params[:pdf_path])
    position = validated_insert_position!(path, params[:position])
    new_path = PdfMaster.add_page(path, position)

    render_pdf_result('Page added successfully.', new_path, fallback_path: path)
  rescue => e
    render_pdf_error(e)
  end

  def remove_page
    path = safe_pdf_path(params[:pdf_path])
    raise StandardError, 'A PDF must keep at least one page.' if pdf_page_count(path) <= 1

    position = validated_page_number!(path, params[:position])
    new_path = PdfMaster.remove_page(path, position)

    render_pdf_result('Page removed successfully.', new_path, fallback_path: path)
  rescue => e
    render_pdf_error(e)
  end

  def duplicate_page
    path = safe_pdf_path(params[:pdf_path])
    page_number = validated_page_number!(path, params[:page_number])
    new_path = PdfMaster.duplicate_pages(path, page_number)

    render_pdf_result('Page duplicated successfully.', new_path, fallback_path: path)
  rescue => e
    render_pdf_error(e)
  end

  def replace_text
    path = safe_pdf_path(params[:pdf_path])
    old_text = required_string!(params[:old_text], 'Text to replace')
    new_text = required_string!(params[:new_text], 'Replacement text')
    new_path = PdfMaster.replace_text(path, old_text, new_text)

    render_pdf_result('Text replaced successfully.', new_path, fallback_path: path)
  rescue => e
    render_pdf_error(e)
  end

  def add_signature
    path = safe_pdf_path(params[:pdf_path])
    page_number = validated_page_number!(path, params[:page_number])
    x, viewer_y, page_width, page_height = validated_viewer_coordinates!(path, page_number, params[:x], params[:y])
    width = validated_optional_number(params[:width], label: 'Signature width', min: 24, max: 420) || DEFAULT_IMAGE_WIDTH
    signature_path = save_valid_upload!(params[:signature], label: 'Signature', allowed_types: ALLOWED_IMAGE_TYPES, max_size: MAX_AUXILIARY_UPLOAD_SIZE)
    validate_image_bounds!(signature_path, page_width, page_height, x, viewer_y, width, label: 'Signature')
    new_path = PdfMaster.add_signature(path, signature_path, x, pdf_top_y(page_height, viewer_y), page_number, nil, { width: width })

    render_pdf_result('Signature added successfully.', new_path, fallback_path: path)
  rescue => e
    render_pdf_error(e)
  end

  def add_watermark
    path = safe_pdf_path(params[:pdf_path])
    page_number = validated_page_number!(path, params[:page_number])
    x, viewer_y, _page_width, page_height = validated_viewer_coordinates!(path, page_number, params[:x], params[:y])
    opacity = validated_optional_number(params[:opacity], label: 'Opacity', min: 0.05, max: 1.0) || 0.25
    font_size = validated_optional_number(params[:font_size], label: 'Font size', min: 16, max: 96) || 48
    rotate = validated_optional_number(params[:rotate], label: 'Rotation', min: -90, max: 90) || 35
    color = validated_hex_color(params[:color], fallback: '9CA3AF')
    new_path = PdfMaster.add_watermark(
      path,
      required_string!(params[:watermark_text], 'Watermark text'),
      x,
      pdf_top_y(page_height, viewer_y),
      page_number,
      nil,
      { opacity: opacity, size: font_size, rotate: rotate, color: color }
    )

    render_pdf_result('Watermark added successfully.', new_path, fallback_path: path)
  rescue => e
    render_pdf_error(e)
  end

  def add_stamp
    path = safe_pdf_path(params[:pdf_path])
    page_number = validated_page_number!(path, params[:page_number])
    x, viewer_y, page_width, page_height = validated_viewer_coordinates!(path, page_number, params[:x], params[:y])
    width = validated_optional_number(params[:width], label: 'Stamp width', min: 24, max: 420) || 120
    stamp_path = save_valid_upload!(params[:stamp], label: 'Stamp', allowed_types: ALLOWED_IMAGE_TYPES, max_size: MAX_AUXILIARY_UPLOAD_SIZE)
    validate_image_bounds!(stamp_path, page_width, page_height, x, viewer_y, width, label: 'Stamp')
    new_path = PdfMaster.add_stamp(path, stamp_path, x, pdf_top_y(page_height, viewer_y), page_number, nil, { width: width })

    render_pdf_result('Stamp added successfully.', new_path, fallback_path: path)
  rescue => e
    render_pdf_error(e)
  end

  def rotate_left
    path = safe_pdf_path(params[:pdf_path])
    page_number = validated_page_number!(path, params[:page_number])
    new_path = PdfMaster.rotate_page(path, 270, page_number)

    render_pdf_result('Page rotated left successfully.', new_path, fallback_path: path)
  rescue => e
    render_pdf_error(e)
  end

  def rotate_right
    path = safe_pdf_path(params[:pdf_path])
    page_number = validated_page_number!(path, params[:page_number])
    new_path = PdfMaster.rotate_page(path, 90, page_number)

    render_pdf_result('Page rotated right successfully.', new_path, fallback_path: path)
  rescue => e
    render_pdf_error(e)
  end

  def merge_pdf
    files = [params[:pdf1], params[:pdf2]].compact
    raise StandardError, 'Two PDF files are required for merge.' if files.size < 2

    file_paths = files.each_with_index.map do |file, index|
      save_valid_upload!(
        file,
        label: "PDF #{index + 1}",
        allowed_types: { '.pdf' => 'application/pdf' },
        max_size: MAX_MERGE_UPLOAD_SIZE,
        validate_pdf_header: true
      )
    end

    output_filename = "merged_#{SecureRandom.hex(4)}.pdf"
    output_path = Rails.root.join('public', 'documents', output_filename)

    PdfMaster.merge_pdfs(output_path.to_s, *file_paths)
    render json: { message: 'PDFs merged successfully.', pdf_url: "/documents/#{output_filename}" }, status: :ok
  rescue => e
    render_pdf_error(e)
  end

  def split_pdf
    path = safe_pdf_path(params[:pdf_path])
    start_page = validated_page_number!(path, params[:start_page], label: 'Start page')
    end_page = validated_page_number!(path, params[:end_page], label: 'End page')
    raise StandardError, 'End page must be greater than or equal to start page.' if end_page < start_page

    output_filename = "extracted_#{SecureRandom.hex(4)}.pdf"
    output_path = Rails.root.join('public', 'documents', output_filename)

    PdfMaster.extract_pages(path, (start_page..end_page).to_a, output_path.to_s)
    render json: { message: 'PDF pages extracted successfully.', pdf_url: "/documents/#{output_filename}" }, status: :ok
  rescue => e
    render_pdf_error(e)
  end

  def encrypt_pdf
    path = safe_pdf_path(params[:pdf_path])
    password = required_string!(params[:password], 'Password')
    raise StandardError, 'Password must be at least 8 characters.' if password.length < 8

    new_path = PdfMaster.secure_pdf(path, password)
    render_pdf_result('PDF encrypted successfully.', new_path, fallback_path: path)
  rescue => e
    render_pdf_error(e)
  end

  def decrypt_pdf
    render json: { message: 'Decrypt PDF functionality not implemented yet.' }, status: :not_implemented
  end

  def update_pdf
    text_boxes = params[:textBoxes]
    file_path = safe_pdf_path(params[:pdfUrl])

    raise StandardError, 'Invalid text box data.' unless text_boxes.is_a?(Hash)

    text_boxes.each do |page_number, boxes|
      validated_page = validated_page_number!(file_path, page_number)
      Array(boxes).each do |box|
        x, y = validated_coordinates!(file_path, validated_page, box['x'], box['y'])
        PdfMaster.add_text(file_path, required_string!(box['text'], 'Text'), x, y, validated_page)
      end
    end

    render json: { message: 'Text added successfully', updated_pdf: file_path }
  rescue => e
    render_pdf_error(e)
  end

  private

  def safe_pdf_path(url_or_path)
    raise StandardError, 'PDF path is required.' if url_or_path.blank?

    clean_path = url_or_path.to_s.split('?').first.to_s.strip.sub(%r{\A/+}, '')
    full_path = clean_path.start_with?('public/') ? Rails.root.join(clean_path).cleanpath : Rails.root.join('public', clean_path).cleanpath
    allowed_roots = %w[uploads documents temp_uploads].map { |directory| Rails.root.join('public', directory).cleanpath }

    unless allowed_roots.any? { |root| path_inside?(full_path, root) }
      raise StandardError, 'Invalid file path access detected.'
    end

    raise StandardError, "File not found: #{clean_path}" unless File.exist?(full_path)
    raise StandardError, 'Only PDF files can be modified.' unless File.extname(full_path.to_s).casecmp('.pdf').zero?

    full_path.to_s
  end

  def path_inside?(path, root)
    path_string = path.to_s
    root_string = root.to_s
    path_string == root_string || path_string.start_with?("#{root_string}/")
  end

  def required_string!(value, label)
    string_value = value.to_s.strip
    raise StandardError, "#{label} is required." if string_value.blank?

    string_value
  end

  def validated_integer!(value, label:, min:, max: nil)
    raise StandardError, "#{label} is required." if value.blank?

    integer_value = Integer(value, exception: false)
    raise StandardError, "#{label} must be a valid whole number." if integer_value.nil?
    raise StandardError, "#{label} must be at least #{min}." if integer_value < min
    raise StandardError, "#{label} must be #{max} or less." if max && integer_value > max

    integer_value
  end

  def validated_page_number!(path, value, label: 'Page number')
    validated_integer!(value, label: label, min: 1, max: pdf_page_count(path))
  end

  def validated_insert_position!(path, value)
    validated_integer!(value, label: 'Page position', min: 1, max: pdf_page_count(path) + 1)
  end

  def validated_coordinates!(path, page_number, x_value, y_value)
    x = validated_integer!(x_value, label: 'X position', min: 0)
    y = validated_integer!(y_value, label: 'Y position', min: 0)
    width, height = pdf_page_dimensions(path, page_number)

    raise StandardError, "X position must be #{width.floor} or less for page #{page_number}." if x > width
    raise StandardError, "Y position must be #{height.floor} or less for page #{page_number}." if y > height

    [x, y]
  end

  def validated_viewer_coordinates!(path, page_number, x_value, y_value)
    x = validated_integer!(x_value, label: 'X position', min: 0)
    y = validated_integer!(y_value, label: 'Y position', min: 0)
    width, height = pdf_page_dimensions(path, page_number)

    raise StandardError, "X position must be #{width.floor} or less for page #{page_number}." if x > width
    raise StandardError, "Y position must be #{height.floor} or less for page #{page_number}." if y > height

    [x, y, width, height]
  end

  def validated_optional_number(value, label:, min:, max:)
    return nil if value.blank?

    number = Float(value, exception: false)
    raise StandardError, "#{label} must be a valid number." if number.nil?
    raise StandardError, "#{label} must be at least #{min}." if number < min
    raise StandardError, "#{label} must be #{max} or less." if number > max

    number
  end

  def validated_hex_color(value, fallback:)
    color = value.to_s.delete_prefix('#').strip
    return fallback if color.blank?
    raise StandardError, 'Color must be a valid 6-digit hex value.' unless color.match?(/\A[0-9a-fA-F]{6}\z/)

    color.upcase
  end

  def pdf_text_y(page_height, viewer_y, font_size)
    [[page_height - viewer_y - font_size, 0].max, page_height].min
  end

  def pdf_top_y(page_height, viewer_y)
    [[page_height - viewer_y, 0].max, page_height].min
  end

  def validate_image_bounds!(image_path, page_width, page_height, x, viewer_y, target_width, label:)
    image = MiniMagick::Image.open(image_path)
    return if image.width.to_f <= 0 || image.height.to_f <= 0

    target_height = image.height.to_f * (target_width.to_f / image.width.to_f)
    raise StandardError, "#{label} extends beyond the page width." if x + target_width > page_width
    raise StandardError, "#{label} extends beyond the page height." if viewer_y + target_height > page_height
  rescue MiniMagick::Error => e
    raise StandardError, "#{label} image could not be inspected: #{e.message}"
  end

  def pdf_page_count(path)
    HexaPDF::Document.open(path) { |document| document.pages.count }
  rescue => e
    raise StandardError, "Unable to inspect PDF page count: #{e.message}"
  end

  def pdf_page_dimensions(path, page_number)
    HexaPDF::Document.open(path) do |document|
      page = document.pages[page_number - 1]
      box = page.box(:media)
      [box.width.to_f, box.height.to_f]
    end
  rescue => e
    raise StandardError, "Unable to inspect PDF page bounds: #{e.message}"
  end

  def save_valid_upload!(uploaded_file, label:, allowed_types:, max_size:, validate_pdf_header: false)
    raise StandardError, "#{label} file is required." unless uploaded_file.respond_to?(:original_filename)
    raise StandardError, "#{label} must be #{max_size / 1.megabyte}MB or smaller." if uploaded_file.size.to_i > max_size

    extension = File.extname(uploaded_file.original_filename.to_s).downcase
    expected_type = allowed_types[extension]
    raise StandardError, "#{label} has an unsupported file extension." if expected_type.blank?

    content_type = uploaded_file.content_type.to_s
    raise StandardError, "#{label} has an unsupported file type." if content_type.present? && content_type != expected_type
    validate_pdf_header!(uploaded_file, label) if validate_pdf_header

    save_temp_file(uploaded_file)
  end

  def validate_pdf_header!(uploaded_file, label)
    uploaded_file.rewind if uploaded_file.respond_to?(:rewind)
    header = uploaded_file.read(4)
    uploaded_file.rewind if uploaded_file.respond_to?(:rewind)
    raise StandardError, "#{label} is not a valid PDF file." unless header == '%PDF'
  end

  def save_temp_file(uploaded_file)
    temp_dir = Rails.root.join('public', 'temp_uploads')
    FileUtils.mkdir_p(temp_dir)

    original_name = File.basename(uploaded_file.original_filename.to_s)
    sanitized_name = original_name.gsub(/[^0-9A-Za-z. _-]/, '')
    sanitized_name = 'upload' if sanitized_name.blank?
    path = temp_dir.join("#{SecureRandom.hex(8)}_#{sanitized_name}")

    uploaded_file.rewind if uploaded_file.respond_to?(:rewind)
    File.open(path, 'wb') { |file| file.write(uploaded_file.read) }
    uploaded_file.rewind if uploaded_file.respond_to?(:rewind)

    path.to_s
  end

  def resolve_web_pdf_path(result_path, fallback_path:)
    candidate_path = result_path.is_a?(String) && result_path.present? ? result_path : fallback_path
    candidate_path = candidate_path.to_s
    return candidate_path.sub(%r{\Apublic}, '') if candidate_path.start_with?('public/')

    candidate_path.sub(Rails.root.join('public').to_s, '')
  end

  def render_pdf_result(message, result_path, fallback_path:)
    web_path = resolve_web_pdf_path(result_path, fallback_path: fallback_path)
    render json: { message: message, pdf_url: web_path }, status: :ok
  end

  def render_pdf_error(error)
    render json: { error: error.message }, status: :unprocessable_content
  end
end
