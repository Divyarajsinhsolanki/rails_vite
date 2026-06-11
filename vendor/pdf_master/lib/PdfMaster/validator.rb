# frozen_string_literal: true

module PdfMaster
  class Validator
    def self.validate_pdf(pdf_path)
      raise Errors::FileNotFoundError, "File does not exist: #{pdf_path}" unless File.exist?(pdf_path)
      raise Errors::InvalidPdfError, "File is not a PDF: #{pdf_path}" unless File.extname(pdf_path).downcase == ".pdf"
      raise Errors::OperationFailedError, "File is not accessible: #{pdf_path}" unless File.readable?(pdf_path)

      begin
        CombinePDF.load(pdf_path)
      rescue StandardError
        raise Errors::InvalidPdfError, "PDF is corrupted or inaccessible: #{pdf_path}"
      end
    end
  end
end
