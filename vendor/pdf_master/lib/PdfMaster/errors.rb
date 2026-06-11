# frozen_string_literal: true

module PdfMaster
  module Errors
    class PdfError < StandardError; end
    class FileNotFoundError < PdfError; end
    class InvalidPdfError < PdfError; end
    class OperationFailedError < PdfError; end
    class SignatureImageNotFoundError < PdfError; end
  end
end
