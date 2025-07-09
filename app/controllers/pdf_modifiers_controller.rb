class PdfModifiersController < ApplicationController
  before_action :set_pdf_paths

  def add_text
    begin
      PdfMaster.add_text(@pdf_path, @text, @x.to_i, @y.to_i, @page_number.to_i)
      render json: { message: "Text added successfully." }, status: :ok
    rescue => e
      render json: { error: e.message }, status: :unprocessable_entity
    end
  end

  def add_page
    begin
      PdfMaster.add_page(@pdf_path, @position.to_i)
      render json: { message: "Page added successfully." }, status: :ok
    rescue => e
      render json: { error: e.message }, status: :unprocessable_entity
    end
  end

  def remove_page
    begin
      PdfMaster.remove_page(@pdf_path, @position.to_i)
      render json: { message: "Page removed successfully." }, status: :ok
    rescue => e
      render json: { error: e.message }, status: :unprocessable_entity
    end
  end

  def duplicate_page
    begin
      PdfMaster.duplicate_pages(@pdf_path, @page_number.to_i)
      render json: { message: "Page duplicated successfully." }, status: :ok
    rescue => e
      render json: { error: e.message }, status: :unprocessable_entity
    end
  end

  def replace_text
    begin
      PdfMaster.replace_text(@pdf_path, @old_text, @new_text)
      render json: { message: "Text replaced successfully." }, status: :ok
    rescue => e
      render json: { error: e.message }, status: :unprocessable_entity
    end
  end

  def add_signature
    begin
      PdfMaster.add_signature(@pdf_path, @signature, @x.to_i, @y.to_i, @page_number.to_i)
      render json: { message: "Signature added successfully." }, status: :ok
    rescue => e
      render json: { error: e.message }, status: :unprocessable_entity
    end
  end

  def add_watermark
    begin
      PdfMaster.add_watermark(@pdf_path, @watermark_text)
      render json: { message: "Watermark added successfully." }, status: :ok
    rescue => e
      render json: { error: e.message }, status: :unprocessable_entity
    end
  end

  def rotate_left
    begin
      PdfMaster.rotate_page(@pdf_path, 270, @page_number.to_i)
      render json: { message: "Page rotated left successfully." }, status: :ok
    rescue => e
      render json: { error: e.message }, status: :unprocessable_entity
    end
  end

  def rotate_right
    begin
      PdfMaster.rotate_page(@pdf_path, 90, @page_number.to_i)
      render json: { message: "Page rotated right successfully." }, status: :ok
    rescue => e
      render json: { error: e.message }, status: :unprocessable_entity
    end
  end

  def merge_pdf

    begin
      PdfMaster.merge_pdfs(@pdf_paths)
      render json: { message: "PDFs merged successfully." }, status: :ok
    rescue => e
      render json: { error: e.message }, status: :unprocessable_entity
    end
  end

  def split_pdf
    begin
      PdfMaster.split_pdf(@pdf_path, @output_folder)
      render json: { message: "PDF split successfully." }, status: :ok
    rescue => e
      render json: { error: e.message }, status: :unprocessable_entity
    end
  end

  def encrypt_pdf
    begin
      PdfMaster.secure_pdf(@pdf_path, @password)
      render json: { message: "PDF encrypted successfully." }, status: :ok
    rescue => e
      render json: { error: e.message }, status: :unprocessable_entity
    end
  end

  def decrypt_pdf
    render json: { message: "Decrypt PDF functionality not implemented yet." }, status: :not_implemented
  end

  def update_pdf
    text_boxes = params[:textBoxes]
    file_path = Rails.root.join("public", @pdfUrl.sub(/^\//, ''))
    text_boxes.each do |page_number, boxes|
      boxes.each do |box|
        PdfMaster.add_text(file_path, box["text"], box["x"].to_i, box["y"].to_i, page_number.to_i)
      end
    end

    render json: { message: "Text added successfully", updated_pdf: file_path }
  end

  private

  def set_pdf_paths
    params.each do |key, value|
      if key.to_s.end_with?("_path")
        path = value.start_with?("/") ? Rails.root.join("public", value.sub(/^\//, "")) : Rails.root.join("public", value)
        instance_variable_set("@#{key}", path.to_s)
      else
        instance_variable_set("@#{key}", value)
      end
    end
  end
end
