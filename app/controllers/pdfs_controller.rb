class PdfsController < ApplicationController
  MAX_PDF_UPLOAD_SIZE = 50.megabytes

  def upload_pdf
    if params[:pdf]
      if params[:pdf].size.to_i > MAX_PDF_UPLOAD_SIZE
        render json: { error: 'File is too large. Maximum size is 50MB.' }, status: :payload_too_large
        return
      end

      unless valid_pdf_upload?(params[:pdf])
        render json: { error: 'Invalid file type. Only PDF files are allowed.' }, status: :unsupported_media_type
        return
      end

      session[:pdf_id] = SecureRandom.uuid
      session[:original_filename] = params[:pdf].original_filename
      session[:download_filename] = params[:pdf].original_filename
      original_path = Rails.root.join('public', 'uploads', "#{session[:pdf_id]}_original.pdf")
      working_path = Rails.root.join('public', 'uploads', "#{session[:pdf_id]}_working.pdf")


      FileUtils.mkdir_p(File.dirname(original_path))
      File.open(original_path, 'wb') { |file| file.write(params[:pdf].read) }
      FileUtils.cp(original_path, working_path)

      render json: {
        pdf_url: "/uploads/#{session[:pdf_id]}_working.pdf",
        original_filename: session[:original_filename],
        download_filename: session[:download_filename]
      }, status: :ok
    else
      render json: { error: "No file uploaded" }, status: :unprocessable_entity
    end
  end

  def reset
    if session[:pdf_id].present?
      original_path = Rails.root.join('public', 'uploads', "#{session[:pdf_id]}_original.pdf")
      working_path = Rails.root.join('public', 'uploads', "#{session[:pdf_id]}_working.pdf")

      if File.exist?(original_path)
        FileUtils.cp(original_path, working_path) # Restore original copy
        render json: { success: true, message: 'PDF reset to original' }
      else
        render json: { success: false, message: 'Original PDF not found' }
      end
    else
      render json: { success: false, message: 'No active session' }
    end
  end

  def download
    working_path = download_path_from_session || download_path_from_param
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

    upload.rewind if upload.respond_to?(:rewind)
    header = upload.read(4)
    upload.rewind if upload.respond_to?(:rewind)
    header == '%PDF'
  rescue
    false
  end

  def requested_download_name
    return if params[:download_name].blank?

    base_name = File.basename(params[:download_name].to_s.strip)
    sanitized_name = base_name.gsub(/[^0-9A-Za-z. _-]/, '')
    return if sanitized_name.blank?

    sanitized_name.end_with?('.pdf') ? sanitized_name : "#{sanitized_name}.pdf"
  end

  def download_path_from_session
    return if session[:pdf_id].blank?

    Rails.root.join('public', 'uploads', "#{session[:pdf_id]}_working.pdf").to_s
  end

  def download_path_from_param
    return if params[:pdf_path].blank?

    requested_path = params[:pdf_path].to_s.sub(%r{\A/+}, '')
    return unless requested_path.match?(/\Auploads\/[0-9a-f\-]+_(?:original|working)\.pdf\z/i)

    full_path = Rails.root.join('public', requested_path).cleanpath
    uploads_root = Rails.root.join('public', 'uploads').to_s

    return unless full_path.to_s.start_with?(uploads_root)
    return unless File.extname(full_path.to_s).casecmp('.pdf').zero?

    full_path.to_s
  end

  def default_download_name(path)
    return "pdf_master.pdf" if path.blank?

    File.basename(path)
  end
end
