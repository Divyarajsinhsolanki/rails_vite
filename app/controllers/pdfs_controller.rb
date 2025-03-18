class PdfsController < ApplicationController
  before_action :get_pdf

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

  def modify
    data = params[:pdf_data]
    text = data[:text]
    x = data[:x].to_f
    y = data[:y].to_f
    page_number = data[:page].to_i

    if page_number < 1 || page_number > @pdf.pages.count
      return render json: { error: "Invalid page number" }, status: :unprocessable_entity
    end

    # Create a new temporary PDF with the text
    temp_pdf = Tempfile.new(["temp", ".pdf"])
    Prawn::Document.generate(temp_pdf.path) do |prawn|
      prawn.text_box text, at: [x, y]
    end

    # Merge the new text layer into the original page
    modified_page = CombinePDF.load(temp_pdf.path).pages.first
    @pdf.pages[page_number - 1] << modified_page

    # Save the modified PDF (overwrite the existing file)
    @pdf.save(@pdf_path)

    temp_pdf.close
    temp_pdf.unlink

    render json: { message: "PDF updated successfully" }, status: :ok
  end

  def add_page
    if File.exist?(@pdf_path)

      blank_page = CombinePDF.new
      blank_page << CombinePDF.parse(Prawn::Document.new.render) # Create a blank page using Prawn

      @pdf << blank_page

      @pdf.save(@pdf_path) # Save the modified PDF
      render json: { message: "Page added successfully" }, status: :ok
    else
      render json: { error: "PDF file not found" }, status: :not_found
    end
  end

  def remove_page
    if File.exist?(@pdf_path)
      puts "📄 Loaded PDF with #{@pdf.pages.count} pages"
  
      if @pdf.pages.count > 1
        new_pdf = CombinePDF.new
        @pdf.pages[0...-1].each { |page| new_pdf << page } # Add all except the last page
        new_pdf.save(@pdf_path)
        
        puts "✅ Page removed and saved, new page count: #{new_pdf.pages.count}"
        render json: { message: "Page removed successfully", pages_remaining: new_pdf.pages.count }, status: :ok
      else
        puts "❌ Cannot remove the last page"
        render json: { error: "Cannot remove the last page" }, status: :unprocessable_entity
      end
    else
      puts "❌ PDF file not found"
      render json: { error: "PDF file not found" }, status: :not_found
    end
  end

  def add_signature
    render json: { message: "PDF " }, status: :ok
  end

  def add_watermark
    render json: { message: "PDF " }, status: :ok
  end

  def add_stamp
    render json: { message: "PDF " }, status: :ok
  end

  def rotate_left
    render json: { message: "PDF " }, status: :ok
  end

  def rotate_right
    render json: { message: "PDF " }, status: :ok
  end

  def merge_pdf
    render json: { message: "PDF " }, status: :ok
  end

  def split_pdf
    render json: { message: "PDF " }, status: :ok
  end

  def encrypt_pdf
    render json: { message: "PDF " }, status: :ok
  end

  def decrypt_pdf
    render json: { message: "PDF " }, status: :ok
  end

  private

  def get_pdf
    @pdf_path = pdf_path = Rails.root.join("public/documents/sample.pdf")
    @pdf = CombinePDF.load(@pdf_path) if File.exist?(@pdf_path)
  end
end
