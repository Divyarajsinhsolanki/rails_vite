class PdfModifiersController < ApplicationController
  before_action :set_pdf_paths

  def add_text
    begin
      PdfModifier.add_text(@pdf_path, @text, @x.to_i, @y.to_i, @page_number.to_i)
      render json: { message: "Text added successfully." }, status: :ok
    rescue => e
puts e
      render json: { error: e.message }, status: :unprocessable_entity
    end
  end

  def add_page
    begin
      PdfModifier.add_page(@pdf_path, @position)
      render json: { message: "Page added successfully." }, status: :ok
    rescue => e
puts e
      puts e
      render json: { error: e.message }, status: :unprocessable_entity
    end
  end

  def remove_page
    begin
      PdfModifier.remove_page(@pdf_path, @position)
      render json: { message: "Page removed successfully." }, status: :ok
    rescue => e
puts e
      puts e
      render json: { error: e.message }, status: :unprocessable_entity
    end
  end

  def add_signature
    begin
      PdfModifier.add_signature(@pdf_path, @signature, @x.to_i, @y.to_i, @page_number.to_i)
      render json: { message: "Signature added successfully." }, status: :ok
    rescue => e
puts e
      render json: { error: e.message }, status: :unprocessable_entity
    end
  end

  def add_watermark
    begin
      PdfModifier.add_watermark(@pdf_path, @watermark_text)
      render json: { message: "Watermark added successfully." }, status: :ok
    rescue => e
puts e
      render json: { error: e.message }, status: :unprocessable_entity
    end
  end

  def rotate_left
    begin
      PdfModifier.rotate_page(@pdf_path, @page_number.to_i, 270)
      render json: { message: "Page rotated left successfully." }, status: :ok
    rescue => e
puts e
      render json: { error: e.message }, status: :unprocessable_entity
    end
  end

  def rotate_right
    begin
      PdfModifier.rotate_page(@pdf_path, @page_number.to_i, 90)
      render json: { message: "Page rotated right successfully." }, status: :ok
    rescue => e
puts e
      render json: { error: e.message }, status: :unprocessable_entity
    end
  end

  def merge_pdf

    begin
      PdfModifier.merge_pdfs(@pdf_paths)
      render json: { message: "PDFs merged successfully." }, status: :ok
    rescue => e
puts e
      render json: { error: e.message }, status: :unprocessable_entity
    end
  end

  def split_pdf
    begin
      PdfModifier.split_pdf(@pdf_path, @output_folder)
      render json: { message: "PDF split successfully." }, status: :ok
    rescue => e
puts e
      render json: { error: e.message }, status: :unprocessable_entity
    end
  end

  def encrypt_pdf
    begin
      PdfModifier.secure_pdf(@pdf_path, @password)
      render json: { message: "PDF encrypted successfully." }, status: :ok
    rescue => e
puts e
      render json: { error: e.message }, status: :unprocessable_entity
    end
  end

  def decrypt_pdf
    render json: { message: "Decrypt PDF functionality not implemented yet." }, status: :not_implemented
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
