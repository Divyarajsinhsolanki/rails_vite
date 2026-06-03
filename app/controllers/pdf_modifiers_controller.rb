require 'hexapdf'
require 'combine_pdf'
require 'prawn'
require 'mini_magick'
require 'open3'
require 'timeout'

class PdfModifiersController < ApplicationController
  include PdfStorage

  MAX_AUXILIARY_UPLOAD_SIZE = 10.megabytes
  MAX_MERGE_UPLOAD_SIZE = 50.megabytes
  MAX_WATERMARK_TEXT_LENGTH = 100
  MAX_PAGES_TO_EXTRACT = 500
  MAX_SPLIT_BY_SIZE_OUTPUTS = 25
  MAX_MERGE_TOTAL_PAGES = 1_000
  MAX_MERGE_FILES = 10
  MAX_IMAGE_EXPORT_PAGES = 100
  MAX_IMAGE_EXPORT_DPI = 200
  MAX_EXPORTED_IMAGE_SIZE = 25.megabytes
  MAX_EXTRACT_TEXT_CHARS = 200_000
  PDF_HISTORY_LIMIT = 20
  PDF_HISTORY_KEY = 'pdf_master_history'.freeze
  PDF_REDO_KEY = 'pdf_master_redo'.freeze
  MAX_IMAGE_PIXEL_DIMENSION = 2_000
  MIN_IMAGE_PIXEL_DIMENSION = 8
  MIN_IMAGE_ASPECT_RATIO = 0.2
  MAX_IMAGE_ASPECT_RATIO = 5.0
  MAX_METADATA_VALUE_LENGTH = 200
  DEFAULT_TEXT_FONT_SIZE = 14
  DEFAULT_IMAGE_WIDTH = 160
  DEFAULT_PAGE_NUMBER_FONT_SIZE = 10
  PAGE_NUMBER_MARGIN = 36
  PAGE_NUMBER_POSITIONS = %w[
    top_left
    top_center
    top_right
    bottom_left
    bottom_center
    bottom_right
  ].freeze
  IMAGE_EXPORT_FORMATS = {
    'png' => { option: '-png', extension: '.png', content_type: 'image/png' },
    'jpg' => { option: '-jpeg', extension: '.jpg', content_type: 'image/jpeg' },
    'jpeg' => { option: '-jpeg', extension: '.jpg', content_type: 'image/jpeg' }
  }.freeze
  PDF_PROTECTION_LEVELS = {
    'low' => %i[modify_content modify_annotation fill_in_forms assemble_document copy_content],
    'standard' => %i[fill_in_forms],
    'high' => []
  }.freeze
  ALLOWED_IMAGE_TYPES = {
    '.jpg' => 'image/jpeg',
    '.jpeg' => 'image/jpeg',
    '.png' => 'image/png'
  }.freeze

  def add_text
    path = safe_pdf_path(params[:pdf_path])
    history_path = pdf_history_snapshot(path, 'add_text')
    page_number = validated_page_number!(path, params[:page_number])
    x, viewer_y, _page_width, page_height = validated_viewer_coordinates!(path, page_number, params[:x], params[:y])
    font_size = validated_optional_number(params[:font_size], label: 'Font size', min: 8, max: 72) || DEFAULT_TEXT_FONT_SIZE
    color = validated_hex_color(params[:color], fallback: '111827')
    pdf_y = pdf_text_y(page_height, viewer_y, font_size)

    new_path = PdfMaster.add_text(path, required_string!(params[:text], 'Text'), x, pdf_y, page_number, nil, { size: font_size, color: color })
    render_pdf_result('Text added successfully.', new_path, fallback_path: path, history_path: history_path)
  rescue => e
    render_pdf_error(e)
  end

  def add_page
    path = safe_pdf_path(params[:pdf_path])
    history_path = pdf_history_snapshot(path, 'add_page')
    position = validated_insert_position!(path, params[:position])
    new_path = PdfMaster.add_page(path, position)

    render_pdf_result('Page added successfully.', new_path, fallback_path: path, history_path: history_path)
  rescue => e
    render_pdf_error(e)
  end

  def remove_page
    path = safe_pdf_path(params[:pdf_path])
    raise StandardError, 'A PDF must keep at least one page.' if pdf_page_count(path) <= 1

    history_path = pdf_history_snapshot(path, 'remove_page')
    position = validated_page_number!(path, params[:position])
    new_path = PdfMaster.remove_page(path, position)

    render_pdf_result('Page removed successfully.', new_path, fallback_path: path, history_path: history_path)
  rescue => e
    render_pdf_error(e)
  end

  def duplicate_page
    path = safe_pdf_path(params[:pdf_path])
    history_path = pdf_history_snapshot(path, 'duplicate_page')
    page_number = validated_page_number!(path, params[:page_number])
    new_path = PdfMaster.duplicate_pages(path, page_number)

    render_pdf_result('Page duplicated successfully.', new_path, fallback_path: path, history_path: history_path)
  rescue => e
    render_pdf_error(e)
  end

  def replace_text
    path = safe_pdf_path(params[:pdf_path])
    history_path = pdf_history_snapshot(path, 'replace_text')
    old_text = required_string!(params[:old_text], 'Text to replace')
    new_text = required_string!(params[:new_text], 'Replacement text')
    new_path = PdfMaster.replace_text(path, old_text, new_text)

    render_pdf_result('Text replaced successfully.', new_path, fallback_path: path, history_path: history_path)
  rescue => e
    render_pdf_error(e)
  end

  def add_signature
    signature_path = nil
    path = safe_pdf_path(params[:pdf_path])
    history_path = pdf_history_snapshot(path, 'add_signature')
    page_number = validated_page_number!(path, params[:page_number])
    x, viewer_y, page_width, page_height = validated_viewer_coordinates!(path, page_number, params[:x], params[:y])
    width = validated_optional_number(params[:width], label: 'Signature width', min: 24, max: 420) || DEFAULT_IMAGE_WIDTH
    signature_path = save_valid_upload!(params[:signature], label: 'Signature', allowed_types: ALLOWED_IMAGE_TYPES, max_size: MAX_AUXILIARY_UPLOAD_SIZE)
    validate_image_bounds!(signature_path, page_width, page_height, x, viewer_y, width, label: 'Signature')
    new_path = PdfMaster.add_signature(path, signature_path, x, pdf_top_y(page_height, viewer_y), page_number, nil, { width: width })

    render_pdf_result('Signature added successfully.', new_path, fallback_path: path, history_path: history_path)
  rescue => e
    render_pdf_error(e)
  ensure
    delete_temp_upload(signature_path)
  end

  def add_watermark
    path = safe_pdf_path(params[:pdf_path])
    history_path = pdf_history_snapshot(path, 'add_watermark')
    page_number = validated_page_number!(path, params[:page_number])
    x, viewer_y, _page_width, page_height = validated_viewer_coordinates!(path, page_number, params[:x], params[:y])
    opacity = validated_optional_number(params[:opacity], label: 'Opacity', min: 0.0, max: 1.0) || 0.25
    raise StandardError, 'Opacity must be between 0 and 1.' unless opacity.between?(0.0, 1.0)

    font_size = validated_optional_number(params[:font_size], label: 'Font size', min: 16, max: 96) || 48
    rotate = validated_optional_number(params[:rotate], label: 'Rotation', min: -180, max: 180) || 35
    raise StandardError, 'Rotation must be between -180 and 180.' unless rotate.between?(-180, 180)

    color = validated_hex_color(params[:color], fallback: '9CA3AF')
    watermark_text = required_string!(params[:watermark_text], 'Watermark text')
    raise StandardError, "Watermark text too long. Maximum #{MAX_WATERMARK_TEXT_LENGTH} characters allowed." if watermark_text.length > MAX_WATERMARK_TEXT_LENGTH

    new_path = PdfMaster.add_watermark(
      path,
      watermark_text,
      x,
      pdf_top_y(page_height, viewer_y),
      page_number,
      nil,
      { opacity: opacity, size: font_size, rotate: rotate, color: color }
    )

    render_pdf_result('Watermark added successfully.', new_path, fallback_path: path, history_path: history_path)
  rescue => e
    render_pdf_error(e)
  end

  def add_stamp
    stamp_path = nil
    path = safe_pdf_path(params[:pdf_path])
    history_path = pdf_history_snapshot(path, 'add_stamp')
    page_number = validated_page_number!(path, params[:page_number])
    x, viewer_y, page_width, page_height = validated_viewer_coordinates!(path, page_number, params[:x], params[:y])
    width = validated_optional_number(params[:width], label: 'Stamp width', min: 24, max: 420) || 120
    stamp_path = save_valid_upload!(params[:stamp], label: 'Stamp', allowed_types: ALLOWED_IMAGE_TYPES, max_size: MAX_AUXILIARY_UPLOAD_SIZE)
    validate_image_bounds!(stamp_path, page_width, page_height, x, viewer_y, width, label: 'Stamp')
    new_path = PdfMaster.add_stamp(path, stamp_path, x, pdf_top_y(page_height, viewer_y), page_number, nil, { width: width })

    render_pdf_result('Stamp added successfully.', new_path, fallback_path: path, history_path: history_path)
  rescue => e
    render_pdf_error(e)
  ensure
    delete_temp_upload(stamp_path)
  end

  def rotate_left
    path = safe_pdf_path(params[:pdf_path])
    history_path = pdf_history_snapshot(path, 'rotate_left')
    page_number = validated_page_number!(path, params[:page_number])
    new_path = PdfMaster.rotate_page(path, 270, page_number)

    render_pdf_result('Page rotated left successfully.', new_path, fallback_path: path, history_path: history_path)
  rescue => e
    render_pdf_error(e)
  end

  def rotate_right
    path = safe_pdf_path(params[:pdf_path])
    history_path = pdf_history_snapshot(path, 'rotate_right')
    page_number = validated_page_number!(path, params[:page_number])
    new_path = PdfMaster.rotate_page(path, 90, page_number)

    render_pdf_result('Page rotated right successfully.', new_path, fallback_path: path, history_path: history_path)
  rescue => e
    render_pdf_error(e)
  end

  def merge_pdf
    file_paths = []
    merge_page_counts = []
    files = merge_pdf_uploads
    raise StandardError, 'At least two PDF files are required for merge.' if files.size < 2
    raise StandardError, "Cannot merge more than #{MAX_MERGE_FILES} PDFs at once." if files.size > MAX_MERGE_FILES

    file_paths = files.each_with_index.map do |file, index|
      path = save_valid_upload!(
        file,
        label: "PDF #{index + 1}",
        allowed_types: { '.pdf' => 'application/pdf' },
        max_size: MAX_MERGE_UPLOAD_SIZE,
        validate_pdf_header: true
      )

      merge_page_counts << readable_pdf_page_count!(path, label: "PDF #{index + 1}")
      path
    end

    total_pages = merge_page_counts.sum
    if total_pages > MAX_MERGE_TOTAL_PAGES
      raise StandardError, "Cannot merge more than #{MAX_MERGE_TOTAL_PAGES} pages at once."
    end

    output_path = private_output_path('merged', 'merged.pdf')

    PdfMaster::Modify.merge_pdfs(output_path.to_s, *file_paths)
    render_pdf_result('PDFs merged successfully.', output_path, fallback_path: output_path)
  rescue => e
    render_pdf_error(e)
  ensure
    Array(file_paths).each { |path| delete_temp_upload(path) }
  end

  def split_pdf
    path = safe_pdf_path(params[:pdf_path])
    history_path = pdf_history_snapshot(path, 'split_pdf')
    start_page = validated_page_number!(path, params[:start_page], label: 'Start page')
    end_page = validated_page_number!(path, params[:end_page], label: 'End page')
    raise StandardError, 'End page must be greater than or equal to start page.' if end_page < start_page

    expected_page_count = end_page - start_page + 1
    if expected_page_count > MAX_PAGES_TO_EXTRACT
      raise StandardError, "Cannot extract more than #{MAX_PAGES_TO_EXTRACT} pages at once."
    end

    output_path = private_output_path('extracted', File.basename(path))

    PdfMaster.extract_pages(path, (start_page..end_page).to_a, output_path.to_s)
    validate_extracted_pdf!(output_path, expected_page_count)
    render_pdf_result('PDF pages extracted successfully.', output_path, fallback_path: output_path, history_path: history_path)
  rescue => e
    render_pdf_error(e)
  end

  def split_by_size
    path = safe_pdf_path(params[:pdf_path])
    max_size_mb = validated_optional_number(params[:max_size], label: 'Maximum file size', min: 1, max: 50) || 10
    output_paths = split_pdf_by_size(path, (max_size_mb * 1.megabyte).to_i)

    pdf_urls = output_paths.each_with_index.map do |output_path, index|
      register_pdf_file!(
        output_path,
        filename: split_part_filename(path, index + 1),
        mark_current: index.zero?
      )
    end

    render json: {
      message: "PDF split into #{pdf_urls.length} file#{'s' unless pdf_urls.length == 1}.",
      pdf_url: pdf_urls.first,
      pdf_urls: pdf_urls
    }, status: :ok
  rescue => e
    render_pdf_error(e)
  end

  def compress_pdf
    path = safe_pdf_path(params[:pdf_path])
    history_path = pdf_history_snapshot(path, 'compress_pdf')
    compression_level = (validated_optional_number(params[:level], label: 'Compression level', min: 1, max: 9) || 6).to_i
    output_path = private_output_path('compressed', File.basename(path))
    previous_level = HexaPDF::GlobalConfiguration['filter.flate.compression']

    HexaPDF::GlobalConfiguration['filter.flate.compression'] = compression_level
    PdfMaster::Modify.compress_pdf(path, output_path.to_s)
    render_pdf_result('PDF compressed successfully.', output_path, fallback_path: path, history_path: history_path)
  rescue => e
    render_pdf_error(e)
  ensure
    HexaPDF::GlobalConfiguration['filter.flate.compression'] = previous_level if defined?(previous_level) && previous_level
  end

  def update_metadata
    path = safe_pdf_path(params[:pdf_path])
    history_path = pdf_history_snapshot(path, 'update_metadata')
    metadata = validated_metadata!
    output_path = private_output_path('metadata', File.basename(path))

    locked_copy(path, output_path)
    PdfMaster::Modify.update_metadata(output_path.to_s, metadata)
    render_pdf_result('PDF metadata updated.', output_path, fallback_path: path, history_path: history_path)
  rescue => e
    render_pdf_error(e)
  end

  def add_page_numbers
    path = safe_pdf_path(params[:pdf_path])
    history_path = pdf_history_snapshot(path, 'add_page_numbers')
    position = validated_page_number_position(params[:position])
    start_number = (validated_optional_number(params[:start], label: 'Start number', min: 0, max: 999_999) || 1).to_i
    font_size = (validated_optional_number(params[:font_size], label: 'Font size', min: 8, max: 36) || DEFAULT_PAGE_NUMBER_FONT_SIZE).to_i
    color = validated_hex_color(params[:color], fallback: '111827')
    output_path = private_output_path('page_numbers', File.basename(path))

    pdf = CombinePDF.load(path)
    raise StandardError, 'PDF has no pages to number.' if pdf.pages.empty?

    pdf.pages.each_with_index do |page, index|
      add_page_number_overlay!(page, (start_number + index).to_s, position, font_size, color)
    end

    pdf.save(output_path.to_s)
    render_pdf_result('Page numbers added.', output_path, fallback_path: path, history_path: history_path)
  rescue => e
    render_pdf_error(e)
  end

  def export_to_images
    path = safe_pdf_path(params[:pdf_path])
    format_config = validated_image_export_format(params[:format])
    dpi = (validated_optional_number(params[:dpi], label: 'DPI', min: 72, max: MAX_IMAGE_EXPORT_DPI) || 144).to_i
    page_count = pdf_page_count(path)
    raise StandardError, "Cannot export more than #{MAX_IMAGE_EXPORT_PAGES} pages to images at once." if page_count > MAX_IMAGE_EXPORT_PAGES

    output_paths = export_pdf_images(path, format_config, dpi)
    urls = output_paths.each_with_index.map do |output_path, index|
      register_pdf_artifact!(
        output_path,
        filename: image_export_filename(path, index + 1, format_config[:extension]),
        content_type: format_config[:content_type]
      )
    end

    render json: {
      message: "PDF converted to #{urls.length} #{format_config[:extension].delete('.').upcase} image#{'s' unless urls.length == 1}.",
      urls: urls
    }, status: :ok
  rescue => e
    render_pdf_error(e)
  end

  def extract_text
    path = safe_pdf_path(params[:pdf_path])
    text = extract_pdf_text(path)
    artifact_path = private_artifact_path('text', "#{File.basename(path, '.pdf')}_text.txt")
    locked_write(artifact_path) { |file| file.write(text) }
    text_url = register_pdf_artifact!(artifact_path, filename: File.basename(artifact_path), content_type: 'text/plain')

    render json: {
      message: 'Text extracted successfully.',
      text: display_extracted_text(text),
      url: text_url,
      truncated: text.length > MAX_EXTRACT_TEXT_CHARS
    }, status: :ok
  rescue => e
    render_pdf_error(e)
  end

  def undo_pdf
    entry = pop_pdf_history!
    push_pdf_redo!(entry)
    pdf_url = register_history_pdf!(entry['before_path'], entry['filename'], entry['before_encrypted'])

    render json: { message: "Undid #{entry['operation'].to_s.humanize}.", pdf_url: pdf_url }, status: :ok
  rescue => e
    render_pdf_error(e)
  end

  def redo_pdf
    entry = pop_pdf_redo!
    push_pdf_history!(entry, clear_redo: false)
    pdf_url = register_history_pdf!(entry['after_path'], entry['filename'], entry['after_encrypted'])

    render json: { message: "Redid #{entry['operation'].to_s.humanize}.", pdf_url: pdf_url }, status: :ok
  rescue => e
    render_pdf_error(e)
  end

  def encrypt_pdf
    path = safe_pdf_path(params[:pdf_path])
    history_path = pdf_history_snapshot(path, 'encrypt_pdf')
    password = required_string!(params[:password], 'Password')
    raise StandardError, 'Password must be at least 8 characters.' if password.length < 8

    output_path = private_output_path('encrypted', File.basename(path))
    HexaPDF::Document.open(path) do |document|
      document.encrypt(owner_password: password, user_password: password)
      document.write(output_path.to_s)
    end
    render_pdf_result('PDF encrypted successfully.', output_path, fallback_path: path, allow_encrypted: true, history_path: history_path)
  rescue => e
    render_pdf_error(e)
  end

  def protect_pdf
    path = safe_pdf_path(params[:pdf_path])
    history_path = pdf_history_snapshot(path, 'protect_pdf')
    password = required_string!(params[:password], 'Password')
    raise StandardError, 'Password must be at least 8 characters.' if password.length < 8

    level = validated_protection_level(params[:level])
    output_path = private_output_path("protected_#{level}", File.basename(path))

    HexaPDF::Document.open(path) do |document|
      document.encrypt(
        owner_password: password,
        user_password: password,
        algorithm: :aes,
        key_length: 256,
        permissions: PDF_PROTECTION_LEVELS[level]
      )
      document.write(output_path.to_s, optimize: true)
    end

    render_pdf_result("PDF protected with #{level} restrictions.", output_path, fallback_path: path, allow_encrypted: true, history_path: history_path)
  rescue => e
    render_pdf_error(e)
  end

  def decrypt_pdf
    path = safe_pdf_path(params[:pdf_path])
    history_path = pdf_history_snapshot(path, 'decrypt_pdf', allow_encrypted: true)
    password = required_string!(params[:password], 'Password')
    output_path = private_output_path('decrypted', File.basename(path))

    HexaPDF::Document.open(path, decryption_opts: { password: password }) do |document|
      document.encrypt(name: nil)
      document.write(output_path.to_s, optimize: true)
    end

    validate_output_pdf!(output_path, password: password)
    render_pdf_result('PDF decrypted successfully.', output_path, fallback_path: path, history_path: history_path, history_before_encrypted: true)
  rescue => e
    render_pdf_error(StandardError.new("Decryption failed: #{e.message}"))
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
    full_path = normalize_pdf_path(editable_pdf_path!(url_or_path))

    raise StandardError, 'Only PDF files can be modified.' unless File.extname(full_path.to_s).casecmp('.pdf').zero?
    raise StandardError, "File not found: #{full_path}" unless File.exist?(full_path)
    full_path.to_s
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

  def merge_pdf_uploads
    merge_keys = params.keys.select { |key| key.to_s.match?(/\Apdf\d+\z/) && params[key].present? }
    merge_keys.sort_by { |key| key.to_s.delete_prefix('pdf').to_i }.map { |key| params[key] }
  end

  def validated_metadata!
    metadata = {
      'Title' => metadata_value(params[:title], 'Title'),
      'Author' => metadata_value(params[:author], 'Author'),
      'Subject' => metadata_value(params[:subject], 'Subject'),
      'Creator' => metadata_value(params[:creator], 'Creator')
    }.compact

    raise StandardError, 'At least one metadata field is required.' if metadata.empty?

    metadata
  end

  def metadata_value(value, label)
    string_value = value.to_s.strip
    return nil if string_value.blank?
    raise StandardError, "#{label} must be #{MAX_METADATA_VALUE_LENGTH} characters or fewer." if string_value.length > MAX_METADATA_VALUE_LENGTH

    string_value
  end

  def validated_page_number_position(value)
    position = value.to_s.presence || 'bottom_right'
    return position if PAGE_NUMBER_POSITIONS.include?(position)

    raise StandardError, "Position must be one of: #{PAGE_NUMBER_POSITIONS.join(', ')}."
  end

  def add_page_number_overlay!(page, text, position, font_size, color)
    temp_path = pdf_private_root.join('temp', "page_number_#{SecureRandom.hex(8)}.pdf")
    width, height = page_dimensions_from_mediabox(page)
    x, y, box_width, align = page_number_text_box(position, width, height, font_size)

    FileUtils.mkdir_p(temp_path.dirname)
    Prawn::Document.generate(temp_path.to_s, page_size: [width, height], margin: 0) do |pdf|
      pdf.fill_color(color)
      pdf.font_size(font_size)
      pdf.text_box(text, at: [x, y], width: box_width, height: font_size + 8, align: align)
    end

    page << CombinePDF.load(temp_path.to_s).pages.first
  ensure
    delete_temp_upload(temp_path)
  end

  def page_dimensions_from_mediabox(page)
    media_box = page.mediabox
    width = (media_box[2].to_f - media_box[0].to_f).abs
    height = (media_box[3].to_f - media_box[1].to_f).abs
    raise StandardError, 'PDF page dimensions could not be read.' if width <= 0 || height <= 0

    [width, height]
  end

  def page_number_text_box(position, page_width, page_height, font_size)
    horizontal_margin = [PAGE_NUMBER_MARGIN, page_width / 4].min
    vertical_margin = [PAGE_NUMBER_MARGIN, page_height / 4].min
    box_width = [[160, page_width - (horizontal_margin * 2)].min, 1].max
    vertical, horizontal = position.split('_', 2)

    y = vertical == 'top' ? page_height - vertical_margin : vertical_margin + font_size
    case horizontal
    when 'left'
      [horizontal_margin, y, box_width, :left]
    when 'center'
      [0, y, page_width, :center]
    else
      [[page_width - horizontal_margin - box_width, horizontal_margin].max, y, box_width, :right]
    end
  end

  def split_pdf_by_size(path, max_size_bytes)
    source_pdf = CombinePDF.load(path)
    raise StandardError, 'PDF has no pages to split.' if source_pdf.pages.empty?

    output_paths = []
    current_pdf = CombinePDF.new
    current_page_count = 0

    source_pdf.pages.each do |page|
      candidate_pdf = clone_combine_pdf(current_pdf)
      candidate_pdf << page
      candidate_size = combine_pdf_byte_size(candidate_pdf)

      if current_page_count.positive? && candidate_size > max_size_bytes
        output_paths << save_split_pdf_segment(current_pdf, path, output_paths.length + 1)
        raise StandardError, "Split would create more than #{MAX_SPLIT_BY_SIZE_OUTPUTS} files." if output_paths.length >= MAX_SPLIT_BY_SIZE_OUTPUTS

        current_pdf = CombinePDF.new
        current_pdf << page
        current_page_count = 1
      else
        current_pdf = candidate_pdf
        current_page_count += 1
      end
    end

    if current_page_count.positive?
      raise StandardError, "Split would create more than #{MAX_SPLIT_BY_SIZE_OUTPUTS} files." if output_paths.length >= MAX_SPLIT_BY_SIZE_OUTPUTS

      output_paths << save_split_pdf_segment(current_pdf, path, output_paths.length + 1)
    end

    output_paths
  end

  def clone_combine_pdf(pdf)
    clone = CombinePDF.new
    pdf.pages.each { |page| clone << page }
    clone
  end

  def combine_pdf_byte_size(pdf)
    temp_path = pdf_private_root.join('temp', "split_probe_#{SecureRandom.hex(8)}.pdf")
    FileUtils.mkdir_p(temp_path.dirname)
    pdf.save(temp_path.to_s)
    File.size(temp_path)
  ensure
    delete_temp_upload(temp_path)
  end

  def save_split_pdf_segment(pdf, original_path, part_number)
    output_path = private_output_path("split_part#{part_number}", split_part_filename(original_path, part_number))
    pdf.save(output_path.to_s)
    validate_output_pdf!(output_path)
    output_path.to_s
  end

  def split_part_filename(original_path, part_number)
    basename = File.basename(original_path, '.pdf')
    "#{basename}_part#{part_number}.pdf"
  end

  def validated_image_export_format(value)
    format = value.to_s.downcase.presence || 'png'
    IMAGE_EXPORT_FORMATS.fetch(format) do
      raise StandardError, "Image format must be one of: #{IMAGE_EXPORT_FORMATS.keys.join(', ')}."
    end
  end

  def validated_protection_level(value)
    level = value.to_s.downcase.presence || 'standard'
    return level if PDF_PROTECTION_LEVELS.key?(level)

    raise StandardError, "Protection level must be one of: #{PDF_PROTECTION_LEVELS.keys.join(', ')}."
  end

  def export_pdf_images(path, format_config, dpi)
    output_dir = pdf_private_root.join('exports', SecureRandom.hex(12)).cleanpath
    FileUtils.mkdir_p(output_dir)
    output_prefix = output_dir.join('page').to_s
    command = ['pdftoppm', format_config[:option], '-r', dpi.to_s, path, output_prefix]
    _stdout, stderr, status = run_pdf_command(command, timeout_seconds: 90)
    raise StandardError, "PDF image export failed: #{stderr.presence || 'unknown error'}" unless status.success?

    output_paths = Dir.glob("#{output_prefix}-*#{format_config[:extension]}").sort_by { |file| image_export_page_number(file) }
    raise StandardError, 'PDF image export did not produce any files.' if output_paths.empty?

    output_paths.each { |output_path| validate_exported_image!(output_path, format_config) }
    output_paths
  end

  def extract_pdf_text(path)
    command = ['pdftotext', '-layout', '-enc', 'UTF-8', path, '-']
    stdout, stderr, status = run_pdf_command(command, timeout_seconds: 60)
    raise StandardError, "Text extraction failed: #{stderr.presence || 'unknown error'}" unless status.success?

    stdout.to_s.encode('UTF-8', invalid: :replace, undef: :replace, replace: '')
  end

  def run_pdf_command(command, timeout_seconds:)
    Timeout.timeout(timeout_seconds) { Open3.capture3(*command) }
  rescue Timeout::Error
    raise StandardError, 'PDF command timed out. Try a smaller PDF or fewer pages.'
  end

  def validate_exported_image!(path, format_config)
    raise StandardError, 'Exported image was not created.' unless File.exist?(path)
    raise StandardError, 'Exported image is empty.' if File.size(path).zero?
    raise StandardError, 'Exported image is too large.' if File.size(path) > MAX_EXPORTED_IMAGE_SIZE
    raise StandardError, 'Exported image has the wrong file type.' unless File.extname(path).downcase == format_config[:extension]

    image = MiniMagick::Image.open(path)
    raise StandardError, 'Exported image has invalid dimensions.' if image.width.to_i <= 0 || image.height.to_i <= 0
  rescue MiniMagick::Error => e
    raise StandardError, "Exported image could not be inspected: #{e.message}"
  end

  def image_export_page_number(path)
    File.basename(path).scan(/\d+/).last.to_i
  end

  def image_export_filename(original_path, page_number, extension)
    "#{File.basename(original_path, '.pdf')}_page_#{page_number}#{extension}"
  end

  def private_artifact_path(prefix, filename)
    ensure_pdf_private_root!
    extension = File.extname(filename.to_s).presence || '.txt'
    base = sanitized_artifact_filename(filename, extension)
    pdf_private_root.join("#{prefix}_#{SecureRandom.hex(12)}_#{base}").cleanpath
  end

  def display_extracted_text(text)
    return text if text.length <= MAX_EXTRACT_TEXT_CHARS

    "#{text[0, MAX_EXTRACT_TEXT_CHARS]}\n\n[Text truncated in preview. Use the download link for the full extraction.]"
  end

  def pdf_history
    session[PDF_HISTORY_KEY] ||= []
  end

  def pdf_redo_stack
    session[PDF_REDO_KEY] ||= []
  end

  def pdf_history_snapshot(path, operation, allow_encrypted: false)
    snapshot_path = private_output_path("history_#{operation}", File.basename(path))
    locked_copy(path, snapshot_path)
    validate_output_pdf!(snapshot_path, allow_encrypted: allow_encrypted)
    snapshot_path.to_s
  end

  def record_pdf_history!(operation:, before_path:, after_path:, filename:, before_encrypted: false, after_encrypted: false)
    return if before_path.blank? || after_path.blank?

    before = normalize_pdf_path(before_path)
    after = normalize_pdf_path(after_path)
    return if before.to_s == after.to_s

    entry = {
      'operation' => operation.to_s,
      'before_path' => private_storage_path_value(before),
      'after_path' => private_storage_path_value(after),
      'filename' => sanitized_pdf_filename(filename),
      'before_encrypted' => before_encrypted,
      'after_encrypted' => after_encrypted,
      'timestamp' => Time.current.to_i
    }
    push_pdf_history!(entry)
  end

  def push_pdf_history!(entry, clear_redo: true)
    session[PDF_HISTORY_KEY] = (pdf_history + [entry]).last(PDF_HISTORY_LIMIT)
    session[PDF_REDO_KEY] = [] if clear_redo
  end

  def push_pdf_redo!(entry)
    session[PDF_REDO_KEY] = (pdf_redo_stack + [entry]).last(PDF_HISTORY_LIMIT)
  end

  def pop_pdf_history!
    history = pdf_history
    raise StandardError, 'No operations to undo.' if history.empty?

    entry = history.pop
    session[PDF_HISTORY_KEY] = history
    entry
  end

  def pop_pdf_redo!
    redo_stack = pdf_redo_stack
    raise StandardError, 'No operations to redo.' if redo_stack.empty?

    entry = redo_stack.pop
    session[PDF_REDO_KEY] = redo_stack
    entry
  end

  def register_history_pdf!(path, filename, allow_encrypted)
    candidate = normalize_private_storage_path(path)
    raise StandardError, 'History PDF path is invalid.' unless path_inside?(candidate, pdf_private_root.cleanpath)
    validate_output_pdf!(candidate, allow_encrypted: allow_encrypted)

    register_pdf_file!(candidate, filename: filename, mark_current: true, allow_encrypted: allow_encrypted)
  end

  def validate_image_bounds!(image_path, page_width, page_height, x, viewer_y, target_width, label:)
    image = MiniMagick::Image.open(image_path)
    validate_uploaded_image_dimensions!(image, label: label)

    target_height = image.height.to_f * (target_width.to_f / image.width.to_f)
    raise StandardError, "#{label} extends beyond the page width." if x + target_width > page_width
    raise StandardError, "#{label} extends beyond the page height." if viewer_y + target_height > page_height
  rescue MiniMagick::Error => e
    raise StandardError, "#{label} image could not be inspected: #{e.message}"
  end

  def validate_uploaded_image_dimensions!(image, label:)
    width = image.width.to_f
    height = image.height.to_f
    raise StandardError, "#{label} image has invalid dimensions." if width <= 0 || height <= 0

    if width < MIN_IMAGE_PIXEL_DIMENSION || height < MIN_IMAGE_PIXEL_DIMENSION
      raise StandardError, "#{label} image is too small. Minimum size is #{MIN_IMAGE_PIXEL_DIMENSION}x#{MIN_IMAGE_PIXEL_DIMENSION} pixels."
    end

    if width > MAX_IMAGE_PIXEL_DIMENSION || height > MAX_IMAGE_PIXEL_DIMENSION
      raise StandardError, "#{label} image must be smaller than #{MAX_IMAGE_PIXEL_DIMENSION}x#{MAX_IMAGE_PIXEL_DIMENSION} pixels."
    end

    aspect_ratio = width / height
    if aspect_ratio > MAX_IMAGE_ASPECT_RATIO || aspect_ratio < MIN_IMAGE_ASPECT_RATIO
      raise StandardError, "#{label} image has an unusual aspect ratio."
    end
  end

  def readable_pdf_page_count!(path, label:)
    page_count = pdf_page_count(path)
    raise StandardError, "#{label} is corrupted or cannot be read." if page_count < 1

    page_count
  rescue => e
    raise StandardError, "#{label} error: #{e.message}"
  end

  def validate_extracted_pdf!(path, expected_page_count)
    validate_output_pdf!(path)
    extracted_page_count = readable_pdf_page_count!(path, label: 'Extracted PDF')
    return if extracted_page_count == expected_page_count

    raise StandardError, "PDF extraction failed. Expected #{expected_page_count} pages but got #{extracted_page_count}."
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
    temp_dir = pdf_private_root.join('temp')
    FileUtils.mkdir_p(temp_dir)

    original_name = File.basename(uploaded_file.original_filename.to_s)
    sanitized_name = original_name.gsub(/[^0-9A-Za-z. _-]/, '')
    sanitized_name = 'upload' if sanitized_name.blank?
    path = temp_dir.join("#{SecureRandom.hex(8)}_#{sanitized_name}")

    uploaded_file.rewind if uploaded_file.respond_to?(:rewind)
    locked_write(path) { |file| file.write(uploaded_file.read) }
    uploaded_file.rewind if uploaded_file.respond_to?(:rewind)
    schedule_pdf_cleanup(path)

    path.to_s
  end

  def delete_temp_upload(path)
    return if path.blank?

    temp_root = pdf_private_root.join('temp').cleanpath
    candidate_path = normalize_pdf_path(path)
    return unless path_inside?(candidate_path, temp_root)

    FileUtils.rm_f(candidate_path)
  end

  def private_pdf_result_path(result_path, fallback_path:, allow_encrypted: false)
    candidate_path = result_path.present? ? result_path : fallback_path
    normalized_path = normalize_pdf_path(candidate_path)
    validate_output_pdf!(normalized_path, allow_encrypted: allow_encrypted)

    return normalized_path.to_s if path_inside?(normalized_path, pdf_private_root.cleanpath)

    move_pdf_to_private!(normalized_path, prefix: 'generated', allow_encrypted: allow_encrypted)
  end

  def render_pdf_result(message, result_path, fallback_path:, allow_encrypted: false, history_path: nil, history_before_encrypted: false)
    private_path = private_pdf_result_path(result_path, fallback_path: fallback_path, allow_encrypted: allow_encrypted)
    filename = session[:download_filename] || File.basename(private_path)
    record_pdf_history!(
      operation: action_name,
      before_path: history_path,
      after_path: private_path,
      filename: filename,
      before_encrypted: history_before_encrypted,
      after_encrypted: allow_encrypted
    )
    pdf_url = register_pdf_file!(
      private_path,
      filename: filename,
      mark_current: true,
      allow_encrypted: allow_encrypted
    )
    render json: { message: message, pdf_url: pdf_url }, status: :ok
  end

  def render_pdf_error(error)
    render json: { error: error.message }, status: :unprocessable_content
  end
end
