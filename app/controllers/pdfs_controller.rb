class PdfsController < ApplicationController
  before_action :get_pdf

  def upload_pdf
    if params[:pdf]
      file = params[:pdf]
      upload_dir = Rails.root.join("public", "documents")

      # Ensure the directory exists
      FileUtils.mkdir_p(upload_dir) unless File.directory?(upload_dir)

      file_path = upload_dir.join(file.original_filename)

      # Save file locally
      File.open(file_path, "wb") { |f| f.write(file.read) }

      render json: { pdf_url: "/documents/#{file.original_filename}" }, status: :ok
    else
      render json: { error: "No file uploaded" }, status: :unprocessable_entity
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

  private

  def get_pdf
    @pdf_path = pdf_path = Rails.root.join("public/documents/sample.pdf")
    @pdf = CombinePDF.load(@pdf_path) if File.exist?(@pdf_path)
  end
end
