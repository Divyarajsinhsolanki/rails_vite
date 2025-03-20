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
    if session[:pdf_id].present?
      working_path = Rails.root.join('public', 'uploads', "#{session[:pdf_id]}_working.pdf")

      file_name = session[:original_filename].present? ? session[:original_filename] : "pdf_modifier.pdf"
      if File.exist?(working_path)
        send_file working_path, type: 'application/pdf', filename: file_name
      else
        render json: { success: false, message: 'PDF not found' }
      end
    else
      render json: { success: false, message: 'No active session' }
    end
  end
end
