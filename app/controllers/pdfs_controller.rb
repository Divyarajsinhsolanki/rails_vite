class PdfsController < ApplicationController

  def upload_pdf
    if params[:pdf]
      session[:pdf_id] = SecureRandom.uuid
      session[:original_filename] = params[:pdf].original_filename
      original_path = Rails.root.join('public', 'uploads', "#{session[:pdf_id]}_original.pdf")
      working_path = Rails.root.join('public', 'uploads', "#{session[:pdf_id]}_working.pdf")


      FileUtils.mkdir_p(File.dirname(original_path))
      File.open(original_path, 'wb') { |file| file.write(params[:pdf].read) }
      FileUtils.cp(original_path, working_path)

      render json: { pdf_url: "/uploads/#{session[:pdf_id]}_working.pdf" }, status: :ok
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
    file_name = session[:original_filename].presence || default_download_name(working_path)

    if working_path.present? && File.exist?(working_path)
      send_file working_path, type: 'application/pdf', filename: file_name
    elsif session[:pdf_id].present?
      render json: { success: false, message: 'PDF not found' }
    else
      render json: { success: false, message: 'No active session' }
    end
  end

  private

  def download_path_from_session
    return if session[:pdf_id].blank?

    Rails.root.join('public', 'uploads', "#{session[:pdf_id]}_working.pdf").to_s
  end

  def download_path_from_param
    return if params[:pdf_path].blank?

    requested_path = params[:pdf_path].to_s.sub(%r{\A/+}, '')
    full_path = Rails.root.join('public', requested_path).cleanpath
    public_root = Rails.root.join('public').to_s

    return unless full_path.to_s.start_with?(public_root)
    return unless File.extname(full_path.to_s).casecmp('.pdf').zero?

    full_path.to_s
  end

  def default_download_name(path)
    return "pdf_modifier.pdf" if path.blank?

    File.basename(path)
  end
end
