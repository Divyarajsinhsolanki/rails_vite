require "hexapdf"

module PdfDocuments
  class Inspector
    Result = Data.define(:page_count, :encrypted, :byte_size)

    def self.call(path, password: nil)
      raise ArgumentError, "PDF file was not created" unless File.file?(path)
      raise ArgumentError, "PDF file is empty" if File.zero?(path)
      raise ArgumentError, "PDF must be 50MB or smaller" if File.size(path) > PdfDocument::MAX_UPLOAD_SIZE

      File.open(path, "rb") do |file|
        raise ArgumentError, "File does not have a valid PDF header" unless file.read(4) == "%PDF"
      end

      options = password.present? ? { decryption_opts: { password: password } } : {}
      document = HexaPDF::Document.open(path, **options)
      encrypted = document.encrypted?
      page_count = document.pages.count
      raise ArgumentError, "PDF must contain at least one page" if page_count.zero?

      Result.new(page_count:, encrypted:, byte_size: File.size(path))
    rescue HexaPDF::EncryptionError
      raise if password.present?

      Result.new(page_count: nil, encrypted: true, byte_size: File.size(path))
    rescue HexaPDF::Error => e
      raise ArgumentError, "PDF is corrupted or unreadable: #{e.message}"
    end
  end
end
