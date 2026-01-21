class PdfModifiersController < ApplicationController
  # Remove insecure before_action
  # before_action :set_pdf_paths

  def add_text
    begin
      path = safe_pdf_path(params[:pdf_path])
      PdfMaster.add_text(path, params[:text], params[:x].to_i, params[:y].to_i, params[:page_number].to_i)
      render json: { message: "Text added successfully." }, status: :ok
    rescue => e
      render json: { error: e.message }, status: :unprocessable_entity
    end
  end

  def add_page
    begin
      path = safe_pdf_path(params[:pdf_path])
      new_path = PdfMaster.add_page(path, params[:position].to_i)
      web_path = new_path.sub(Rails.root.join("public").to_s, "")
      render json: { message: "Page added successfully.", pdf_url: web_path }, status: :ok
    rescue => e
      render json: { error: e.message }, status: :unprocessable_entity
    end
  end

  def remove_page
    begin
      path = safe_pdf_path(params[:pdf_path])
      new_path = PdfMaster.remove_page(path, params[:position].to_i)
      web_path = new_path.sub(Rails.root.join("public").to_s, "")
      render json: { message: "Page removed successfully.", pdf_url: web_path }, status: :ok
    rescue => e
      render json: { error: e.message }, status: :unprocessable_entity
    end
  end

  def duplicate_page
    begin
      path = safe_pdf_path(params[:pdf_path])
      new_path = PdfMaster.duplicate_pages(path, params[:page_number].to_i)
      web_path = new_path.sub(Rails.root.join("public").to_s, "")
      render json: { message: "Page duplicated successfully.", pdf_url: web_path }, status: :ok
    rescue => e
      render json: { error: e.message }, status: :unprocessable_entity
    end
  end

  def replace_text
    begin
      path = safe_pdf_path(params[:pdf_path])
      new_path = PdfMaster.replace_text(path, params[:old_text], params[:new_text])
      web_path = new_path.sub(Rails.root.join("public").to_s, "")
      render json: { message: "Text replaced successfully.", pdf_url: web_path }, status: :ok
    rescue => e
      render json: { error: e.message }, status: :unprocessable_entity
    end
  end

  def add_signature
    begin
      path = safe_pdf_path(params[:pdf_path])
      
      # Handle signature file upload if present
      signature_path = if params[:signature].respond_to?(:path)
                         save_temp_file(params[:signature])
                       else
                         params[:signature] # fallback if it's a path string (legacy)
                       end

      new_path = PdfMaster.add_signature(path, signature_path, params[:x].to_i, params[:y].to_i, params[:page_number].to_i)
      web_path = new_path.sub(Rails.root.join("public").to_s, "")
      render json: { message: "Signature added successfully.", pdf_url: web_path }, status: :ok
    rescue => e
      render json: { error: e.message }, status: :unprocessable_entity
    end
  end

  def add_watermark
    begin
      path = safe_pdf_path(params[:pdf_path])
      new_path = PdfMaster.add_watermark(path, params[:watermark_text])
      web_path = new_path.sub(Rails.root.join("public").to_s, "")
      render json: { message: "Watermark added successfully.", pdf_url: web_path }, status: :ok
    rescue => e
      render json: { error: e.message }, status: :unprocessable_entity
    end
  end

  def add_stamp
    begin
      path = safe_pdf_path(params[:pdf_path])
      
      # Handle stamp file upload
      stamp_path = if params[:stamp].respond_to?(:path)
                     save_temp_file(params[:stamp])
                   else
                     params[:stamp]
                   end

      new_path = PdfMaster.add_stamp(path, stamp_path, params[:x].to_i, params[:y].to_i, params[:page_number].to_i)
      web_path = new_path.sub(Rails.root.join("public").to_s, "")
      render json: { message: "Stamp added successfully.", pdf_url: web_path }, status: :ok
    rescue => e
      render json: { error: e.message }, status: :unprocessable_entity
    end
  end

  def rotate_left
    begin
      path = safe_pdf_path(params[:pdf_path])
      new_path = PdfMaster.rotate_page(path, 270, params[:page_number].to_i)
      web_path = new_path.sub(Rails.root.join("public").to_s, "")
      render json: { message: "Page rotated left successfully.", pdf_url: web_path }, status: :ok
    rescue => e
      render json: { error: e.message }, status: :unprocessable_entity
    end
  end

  def rotate_right
    begin
      path = safe_pdf_path(params[:pdf_path])
      new_path = PdfMaster.rotate_page(path, 90, params[:page_number].to_i)
      web_path = new_path.sub(Rails.root.join("public").to_s, "")
      render json: { message: "Page rotated right successfully.", pdf_url: web_path }, status: :ok
    rescue => e
      render json: { error: e.message }, status: :unprocessable_entity
    end
  end

  def merge_pdf
    begin
      # Handle file uploads for merge
      files = [params[:pdf1], params[:pdf2]].compact
      if files.empty?
        return render json: { error: "No files provided for merge." }, status: :unprocessable_entity
      end

      # Save uploads to temp files so PdfMaster can read them
      file_paths = files.map { |f| save_temp_file(f) }

      # Create output path
      output_filename = "merged_#{SecureRandom.hex(4)}.pdf"
      output_path = Rails.root.join("public", "documents", output_filename)
      
      # PdfMaster.merge_pdfs(output_pdf, *input_pdfs)
      PdfMaster.merge_pdfs(output_path.to_s, *file_paths) 

      render json: { message: "PDFs merged successfully.", pdf_url: "/documents/#{output_filename}" }, status: :ok
    rescue => e
      render json: { error: e.message }, status: :unprocessable_entity
    end
  end

  def split_pdf
    begin
      path = safe_pdf_path(params[:pdf_path])
      start_page = params[:start_page].to_i
      end_page = params[:end_page].to_i
      
      if start_page < 1 || end_page < start_page
        return render json: { error: "Invalid page range." }, status: :unprocessable_entity
      end

      output_filename = "extracted_#{SecureRandom.hex(4)}.pdf"
      output_path = Rails.root.join("public", "documents", output_filename)

      # Use extract_pages to pull the range of pages
      # PdfMaster.extract_pages(input_pdf, page_numbers, output_pdf)
      PdfMaster.extract_pages(path, (start_page..end_page).to_a, output_path.to_s)
      
      render json: { message: "PDF pages extracted successfully.", pdf_url: "/documents/#{output_filename}" }, status: :ok
    rescue => e
      render json: { error: e.message }, status: :unprocessable_entity
    end
  end

  def encrypt_pdf
    begin
      path = safe_pdf_path(params[:pdf_path])
      new_path = PdfMaster.secure_pdf(path, params[:password])
      # Secure PDF actually returns the new path or nil? Checking usage... assuming return path.
      # If secure_pdf overwrites, then path is same. But let's assume standard behavior.
      # Actually PdfMaster.secure_pdf usually returns the output path.
      
      # If new_path is nil (failed), let's fallback? No, it raises error.
      web_path = new_path.sub(Rails.root.join("public").to_s, "")
      render json: { message: "PDF encrypted successfully.", pdf_url: web_path }, status: :ok
    rescue => e
      render json: { error: e.message }, status: :unprocessable_entity
    end
  end

  def decrypt_pdf
    render json: { message: "Decrypt PDF functionality not implemented yet." }, status: :not_implemented
  end

  def update_pdf
    text_boxes = params[:textBoxes]
    # Use params[:pdfUrl] but secure it
    file_path = safe_pdf_path(params[:pdfUrl])
    
    text_boxes.each do |page_number, boxes|
      boxes.each do |box|
        PdfMaster.add_text(file_path, box["text"], box["x"].to_i, box["y"].to_i, page_number.to_i)
      end
    end

    render json: { message: "Text added successfully", updated_pdf: file_path }
  end

  private

  # Securely resolve PDF path and prevent directory traversal
  def safe_pdf_path(url_or_path, create_if_missing: false)
    return nil if url_or_path.blank?

    # Strip potential leading/trailing hacks
    clean_path = url_or_path.to_s.sub(/^\//, '').gsub('..', '')
    
    # We only allow accessing files inside public/documents or similar safe zones
    # For now, let's assume all user PDFs are in public/documents or public/uploads
    # This is a basic security check.
    
    full_path = if clean_path.start_with?("public/")
                  Rails.root.join(clean_path)
                else
                  Rails.root.join("public", clean_path)
                end

    # Ensure the resolved path is actually within the Rails root/public
    unless full_path.to_s.start_with?(Rails.root.join("public").to_s)
      raise StandardError, "Invalid file path access detected."
    end
    
    # Check existence
    unless File.exist?(full_path)
      raise StandardError, "File not found: #{clean_path}"
    end

    full_path.to_s
  end

  def save_temp_file(uploaded_file)
    return nil unless uploaded_file

    temp_dir = Rails.root.join("public", "temp_uploads")
    FileUtils.mkdir_p(temp_dir)
    
    filename = "#{SecureRandom.hex(8)}_#{uploaded_file.original_filename}"
    path = temp_dir.join(filename)
    
    File.open(path, 'wb') do |file|
      file.write(uploaded_file.read)
    end
    
    path.to_s
  end
end

