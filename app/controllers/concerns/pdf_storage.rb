require 'pathname'
require 'fileutils'
require 'hexapdf'

module PdfStorage
  extend ActiveSupport::Concern

  included do
    before_action :discard_legacy_pdf_cookie_records
  end

  PDF_PRIVATE_ROOT = Rails.root.join('storage', 'pdf_master').freeze
  PDF_TOKEN_TTL = 24.hours
  PDF_SESSION_KEY = 'pdf_master_files'.freeze
  PDF_ARTIFACT_SESSION_KEY = 'pdf_master_artifacts'.freeze
  PDF_ACTIVE_TOKEN_KEY = 'pdf_master_active_token'.freeze
  PDF_ALLOWED_PUBLIC_ROOTS = %w[uploads documents temp_uploads].freeze
  PDF_MAX_SESSION_FILES = 40
  PDF_MAX_SESSION_ARTIFACTS = 120
  PDF_MAX_FILENAME_STEM_LENGTH = 80
  PDF_ALLOWED_ARTIFACT_TYPES = {
    '.png' => 'image/png',
    '.jpg' => 'image/jpeg',
    '.jpeg' => 'image/jpeg',
    '.txt' => 'text/plain'
  }.freeze

  private

  def pdf_private_root
    PDF_PRIVATE_ROOT
  end

  def ensure_pdf_private_root!
    FileUtils.mkdir_p(pdf_private_root)
  end

  def cleanup_stale_pdf_files!
    return unless Dir.exist?(pdf_private_root)

    cutoff = PDF_TOKEN_TTL.ago
    Dir.glob(pdf_private_root.join('**', '*')).each do |path|
      next if File.directory?(path)
      next unless File.mtime(path) < cutoff

      FileUtils.rm_f(path)
    end
  end

  def session_pdf_files
    raw_files = session[PDF_SESSION_KEY]
    raw_files.is_a?(Hash) ? raw_files : {}
  end

  def session_pdf_artifacts
    raw_artifacts = session[PDF_ARTIFACT_SESSION_KEY]
    raw_artifacts.is_a?(Hash) ? raw_artifacts : {}
  end

  def prune_pdf_session!
    session.delete(PDF_SESSION_KEY)
  end

  def prune_pdf_artifacts!
    session.delete(PDF_ARTIFACT_SESSION_KEY)
  end

  def register_pdf_file!(path, filename: nil, mark_current: true, allow_encrypted: false)
    cleanup_stale_pdf_files!
    prune_pdf_session!

    private_path = normalize_pdf_path(path)
    raise StandardError, 'PDF output is outside private storage.' unless path_inside?(private_path, pdf_private_root.cleanpath)

    validate_output_pdf!(private_path, allow_encrypted: allow_encrypted)

    token = SecureRandom.urlsafe_base64(32)
    expires_at = PDF_TOKEN_TTL.from_now
    record = {
      'path' => private_storage_path_value(private_path),
      'filename' => sanitized_pdf_filename(filename || session[:download_filename] || File.basename(private_path.to_s)),
      'created_at' => Time.current.to_i,
      'expires_at' => expires_at.to_i
    }
    locked_write(pdf_record_path(token)) { |file| file.write(record.to_json) }

    if mark_current
      session[PDF_ACTIVE_TOKEN_KEY] = token
      session[:pdf_working_path] = private_storage_path_value(private_path)
      session[:download_filename] = record['filename']
    end

    schedule_pdf_cleanup(private_path)
    pdf_file_url(token)
  end

  def register_pdf_artifact!(path, filename: nil, content_type: nil)
    cleanup_stale_pdf_files!
    prune_pdf_artifacts!

    private_path = normalize_pdf_path(path)
    raise StandardError, 'PDF artifact is outside private storage.' unless path_inside?(private_path, pdf_private_root.cleanpath)
    raise StandardError, 'PDF artifact was not created.' unless File.exist?(private_path)
    raise StandardError, 'PDF artifact is empty.' if File.size(private_path).zero?

    extension = File.extname(private_path.to_s).downcase
    artifact_type = content_type.presence || PDF_ALLOWED_ARTIFACT_TYPES[extension]
    raise StandardError, 'PDF artifact type is not supported.' if artifact_type.blank?

    token = SecureRandom.urlsafe_base64(32)
    expires_at = PDF_TOKEN_TTL.from_now
    record = {
      'path' => private_storage_path_value(private_path),
      'filename' => sanitized_artifact_filename(filename || File.basename(private_path.to_s), extension),
      'content_type' => artifact_type,
      'created_at' => Time.current.to_i,
      'expires_at' => expires_at.to_i
    }
    locked_write(pdf_artifact_record_path(token)) { |file| file.write(record.to_json) }

    schedule_pdf_cleanup(private_path)
    pdf_artifact_url(token)
  end

  def pdf_file_url(token)
    "/pdf_file/#{token}"
  end

  def pdf_artifact_url(token)
    "/pdf_artifact/#{token}"
  end

  def token_from_pdf_reference(reference)
    clean_reference = reference.to_s.split('?').first.strip
    match = clean_reference.match(%r{\A/?pdf_file/([^/]+)\z})
    return match[1] if match
    return clean_reference if File.exist?(pdf_record_path(clean_reference))
    return clean_reference if session_pdf_files.key?(clean_reference)

    nil
  end

  def trimmed_pdf_files(files)
    return files if files.size <= PDF_MAX_SESSION_FILES

    files.sort_by { |_token, record| record['created_at'].to_i }.last(PDF_MAX_SESSION_FILES).to_h
  end

  def trimmed_pdf_artifacts(artifacts)
    return artifacts if artifacts.size <= PDF_MAX_SESSION_ARTIFACTS

    artifacts.sort_by { |_token, record| record['created_at'].to_i }.last(PDF_MAX_SESSION_ARTIFACTS).to_h
  end

  def pdf_record_for_token!(token)
    prune_pdf_session!
    record = if File.exist?(pdf_record_path(token))
               JSON.parse(File.read(pdf_record_path(token)))
             else
               session_pdf_files[token.to_s]
             end
    raise StandardError, 'PDF access has expired. Please upload the PDF again.' if record.blank?
    if record['expires_at'].to_i <= Time.current.to_i
      FileUtils.rm_f(pdf_record_path(token))
      raise StandardError, 'PDF access has expired. Please upload the PDF again.'
    end

    path = normalize_private_storage_path(record['path'])
    raise StandardError, 'PDF access path is invalid.' unless path_inside?(path, pdf_private_root.cleanpath)
    raise StandardError, 'PDF file was not found.' unless File.exist?(path)

    record.merge('path' => path.to_s)
  end

  def pdf_path_from_token!(token)
    pdf_record_for_token!(token)['path']
  end

  def pdf_artifact_record_for_token!(token)
    record_path = pdf_artifact_record_path(token)
    raise StandardError, 'PDF artifact access has expired. Please generate it again.' unless File.exist?(record_path)

    record = JSON.parse(File.read(record_path))
    raise StandardError, 'PDF artifact access has expired. Please generate it again.' if record.blank?
    if record['expires_at'].to_i <= Time.current.to_i
      FileUtils.rm_f(record_path)
      raise StandardError, 'PDF artifact access has expired. Please generate it again.'
    end

    path = normalize_private_storage_path(record['path'])
    raise StandardError, 'PDF artifact path is invalid.' unless path_inside?(path, pdf_private_root.cleanpath)
    raise StandardError, 'PDF artifact was not found.' unless File.exist?(path)

    record.merge('path' => path.to_s)
  end

  def pdf_artifact_record_path(token)
    safe_token = token.to_s.gsub(/[^0-9A-Za-z_-]/, '')
    pdf_private_root.join('artifact_records', "#{safe_token}.json").cleanpath
  end

  def pdf_record_path(token)
    safe_token = token.to_s.gsub(/[^0-9A-Za-z_-]/, '')
    pdf_private_root.join('pdf_records', "#{safe_token}.json").cleanpath
  end

  def editable_pdf_path!(reference)
    token = token_from_pdf_reference(reference)
    return pdf_path_from_token!(token) if token.present?

    legacy_path = legacy_public_pdf_path(reference)
    raise StandardError, 'PDF path is required.' if legacy_path.blank?

    copy_pdf_to_private!(legacy_path, prefix: 'imported')
  end

  def legacy_public_pdf_path(reference)
    return if reference.blank?

    clean_path = reference.to_s.split('?').first.to_s.strip.sub(%r{\A/+}, '')
    clean_path = clean_path.sub(%r{\Apublic/}, '')
    full_path = Rails.root.join('public', clean_path).cleanpath
    allowed_roots = PDF_ALLOWED_PUBLIC_ROOTS.map { |directory| Rails.root.join('public', directory).cleanpath }

    return unless allowed_roots.any? { |root| path_inside?(full_path, root) }
    return unless File.extname(full_path.to_s).casecmp('.pdf').zero?
    return unless File.exist?(full_path)

    full_path.to_s
  end

  def copy_pdf_to_private!(source_path, prefix:)
    source = normalize_pdf_path(source_path)
    validate_output_pdf!(source)

    target = private_output_path(prefix, File.basename(source.to_s))
    locked_copy(source, target)
    validate_output_pdf!(target)
    target.to_s
  end

  def move_pdf_to_private!(source_path, prefix: 'pdf', allow_encrypted: false)
    source = normalize_pdf_path(source_path)
    return source.to_s if path_inside?(source, pdf_private_root.cleanpath)

    validate_output_pdf!(source, allow_encrypted: allow_encrypted)
    target = private_output_path(prefix, File.basename(source.to_s))
    FileUtils.mkdir_p(File.dirname(target))
    FileUtils.mv(source, target)
    validate_output_pdf!(target, allow_encrypted: allow_encrypted)
    target.to_s
  end

  def private_output_path(prefix, original_filename = 'document.pdf')
    ensure_pdf_private_root!
    base = sanitized_pdf_filename(original_filename)
    base = "#{File.basename(base, '.pdf')}.pdf"
    pdf_private_root.join("#{prefix}_#{SecureRandom.hex(12)}_#{base}").cleanpath
  end

  def normalize_pdf_path(path)
    pathname = Pathname.new(path.to_s)
    pathname = Rails.root.join(pathname) unless pathname.absolute?
    pathname.cleanpath
  end

  def normalize_private_storage_path(path)
    pathname = Pathname.new(path.to_s)
    pathname = pdf_private_root.join(pathname) unless pathname.absolute?
    pathname.cleanpath
  end

  def private_storage_path_value(path)
    private_path = normalize_pdf_path(path)
    root = pdf_private_root.cleanpath
    return private_path.relative_path_from(root).to_s if path_inside?(private_path, root)

    private_path.to_s
  end

  def path_inside?(path, root)
    path_string = path.to_s
    root_string = root.to_s
    path_string == root_string || path_string.start_with?("#{root_string}/")
  end

  def validate_output_pdf!(path, allow_encrypted: false, password: nil)
    path = normalize_pdf_path(path)
    raise StandardError, 'PDF output file was not created.' unless File.exist?(path)
    raise StandardError, 'PDF output file is empty.' if File.size(path).zero?
    raise StandardError, 'PDF output must use a .pdf extension.' unless File.extname(path.to_s).casecmp('.pdf').zero?

    File.open(path, 'rb') do |file|
      raise StandardError, 'PDF output does not have a valid PDF header.' unless file.read(4) == '%PDF'
    end

    open_options = password.present? ? { decryption_opts: { password: password } } : {}
    HexaPDF::Document.open(path.to_s, **open_options) { |document| document.pages.count }
  rescue HexaPDF::Error
    raise if !allow_encrypted

    true
  end

  def schedule_pdf_cleanup(path)
    DeletePdfFileJob.set(wait: PDF_TOKEN_TTL).perform_later(path.to_s, minimum_age_seconds: PDF_TOKEN_TTL.to_i)
  rescue => e
    Rails.logger.warn("PDF cleanup scheduling failed for #{path}: #{e.message}")
  end

  def sanitized_pdf_filename(filename)
    base_name = File.basename(filename.to_s.strip)
    sanitized_name = base_name.gsub(/[^0-9A-Za-z. _-]/, '')
    sanitized_name = 'document.pdf' if sanitized_name.blank?
    sanitized_name = sanitized_name.end_with?('.pdf') ? sanitized_name : "#{sanitized_name}.pdf"
    stem = File.basename(sanitized_name, '.pdf')[0, PDF_MAX_FILENAME_STEM_LENGTH].presence || 'document'
    "#{stem}.pdf"
  end

  def sanitized_artifact_filename(filename, fallback_extension)
    base_name = File.basename(filename.to_s.strip)
    sanitized_name = base_name.gsub(/[^0-9A-Za-z. _-]/, '')
    extension = File.extname(sanitized_name).presence || fallback_extension
    stem = File.basename(sanitized_name, extension)[0, PDF_MAX_FILENAME_STEM_LENGTH].presence || 'pdf_artifact'
    "#{stem}#{extension}"
  end

  def locked_write(path)
    FileUtils.mkdir_p(File.dirname(path))
    File.open(path, 'wb') do |file|
      file.flock(File::LOCK_EX)
      yield file
      file.flush
      file.fsync
    end
  end

  def locked_copy(source, target)
    FileUtils.mkdir_p(File.dirname(target))
    File.open(source, 'rb') do |source_file|
      source_file.flock(File::LOCK_SH)
      locked_write(target) { |target_file| IO.copy_stream(source_file, target_file) }
    end
  end

  def discard_legacy_pdf_cookie_records
    session.delete(PDF_SESSION_KEY)
    session.delete(PDF_ARTIFACT_SESSION_KEY)
  end
end
