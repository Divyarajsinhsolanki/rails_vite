class PdfsController < ApplicationController
  include PdfStorage

  MAX_PDF_UPLOAD_SIZE = 50.megabytes
  LEGACY_PDF_HISTORY_SESSION_KEYS = %w[pdf_master_history pdf_master_redo].freeze

  before_action :discard_legacy_pdf_modifier_history

  def upload_pdf
    cleanup_stale_pdf_files!

    unless params[:pdf]
      render json: { error: "No file uploaded" }, status: :unprocessable_entity
      return
    end

    if params[:pdf].size.to_i > MAX_PDF_UPLOAD_SIZE
      render json: { error: 'File is too large. Maximum size is 50MB.' }, status: :payload_too_large
      return
    end

    unless valid_pdf_upload?(params[:pdf])
      render json: { error: 'Invalid file type. Only PDF files are allowed.' }, status: :unsupported_media_type
      return
    end

    session[:pdf_id] = SecureRandom.uuid
    session[:original_filename] = sanitized_pdf_filename(params[:pdf].original_filename)
    session[:download_filename] = session[:original_filename]

    original_path = pdf_private_root.join("#{session[:pdf_id]}_original.pdf").cleanpath
    working_path = pdf_private_root.join("#{session[:pdf_id]}_working.pdf").cleanpath

    params[:pdf].rewind if params[:pdf].respond_to?(:rewind)
    locked_write(original_path) { |file| file.write(params[:pdf].read) }
    params[:pdf].rewind if params[:pdf].respond_to?(:rewind)
    validate_output_pdf!(original_path)

    locked_copy(original_path, working_path)
    validate_output_pdf!(working_path)

    session[:pdf_original_path] = private_storage_path_value(original_path)
    session[:pdf_working_path] = private_storage_path_value(working_path)
    pdf_url = register_pdf_file!(working_path, filename: session[:download_filename], mark_current: true)

    render json: {
      pdf_url: pdf_url,
      original_filename: session[:original_filename],
      download_filename: session[:download_filename]
    }, status: :ok
  end

  def reset
    original_path = pdf_session_private_path(session[:pdf_original_path])
    working_path = pdf_session_private_path(session[:pdf_working_path])

    if original_path.present? && working_path.present? && File.exist?(original_path)
      locked_copy(original_path, working_path)
      validate_output_pdf!(working_path)
      pdf_url = register_pdf_file!(working_path, filename: session[:download_filename] || session[:original_filename], mark_current: true)
      render json: { success: true, message: 'PDF reset to original', pdf_url: pdf_url }
    elsif session[:pdf_id].present?
      render json: { success: false, message: 'Original PDF not found' }
    else
      render json: { success: false, message: 'No active session' }
    end
  end

  def show
    record = pdf_record_for_token!(params[:token])
    response.headers['Cache-Control'] = 'private, no-store'
    send_file record['path'], type: 'application/pdf', filename: record['filename'], disposition: 'inline'
  rescue => e
    render json: { error: e.message }, status: :not_found
  end

  def artifact
    record = pdf_artifact_record_for_token!(params[:token])
    response.headers['Cache-Control'] = 'private, no-store'
    send_file record['path'], type: record['content_type'], filename: record['filename'], disposition: artifact_disposition
  rescue => e
    render json: { error: e.message }, status: :not_found
  end

  def download
    working_path = download_path_from_param || download_path_from_session
    file_name = requested_download_name.presence || session[:download_filename].presence || session[:original_filename].presence || default_download_name(working_path)

    if working_path.present? && File.exist?(working_path)
      send_file working_path, type: 'application/pdf', filename: file_name
    elsif session[:pdf_id].present?
      render json: { success: false, message: 'PDF not found' }
    else
      render json: { success: false, message: 'No active session' }
    end
  end

  private

  def valid_pdf_upload?(upload)
    return false unless File.extname(upload.original_filename.to_s).casecmp('.pdf').zero?
    return false unless valid_pdf_content_type?(upload.content_type)

    upload.rewind if upload.respond_to?(:rewind)
    header = upload.read(4)
    upload.rewind if upload.respond_to?(:rewind)
    header == '%PDF'
  rescue
    false
  end

  def valid_pdf_content_type?(content_type)
    content_type.to_s == 'application/pdf'
  end

  def requested_download_name
    return if params[:download_name].blank?

    base_name = File.basename(params[:download_name].to_s.strip)
    sanitized_name = base_name.gsub(/[^0-9A-Za-z. _-]/, '')
    return if sanitized_name.blank?

    sanitized_name.end_with?('.pdf') ? sanitized_name : "#{sanitized_name}.pdf"
  end

  def download_path_from_session
    return if session[:pdf_working_path].blank?

    path = pdf_session_private_path(session[:pdf_working_path])
    return unless path_inside?(path, pdf_private_root.cleanpath)
    return unless File.exist?(path)

    path.to_s
  end

  def download_path_from_param
    return if params[:pdf_path].blank?

    token = token_from_pdf_reference(params[:pdf_path])
    return pdf_path_from_token!(token) if token.present?

    legacy_public_pdf_path(params[:pdf_path])
  end

  def default_download_name(path)
    return "pdf_master.pdf" if path.blank?

    File.basename(path)
  end

  def artifact_disposition
    params[:download].present? || params[:disposition].to_s == 'attachment' ? 'attachment' : 'inline'
  end

  def pdf_session_private_path(value)
    return if value.blank?

    normalize_private_storage_path(value)
  end

  def discard_legacy_pdf_modifier_history
    LEGACY_PDF_HISTORY_SESSION_KEYS.each { |key| session.delete(key) }
  end
end
