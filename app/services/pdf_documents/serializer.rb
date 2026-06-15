module PdfDocuments
  class Serializer
    include Rails.application.routes.url_helpers

    def initialize(document, context:)
      @document = document
      @context = context
    end

    def as_json(*)
      current = @document.current_version
      {
        id: @document.id,
        title: @document.title,
        original_filename: @document.original_filename,
        page_count: @document.page_count,
        encrypted: @document.encrypted,
        byte_size: current&.byte_size.to_i,
        storage_bytes: @document.storage_bytes,
        current_version_id: current&.id,
        current_version_number: current&.version_number,
        can_undo: @document.undo_version.present?,
        can_redo: @document.redo_version.present?,
        content_url: current ? @context.content_api_pdf_document_path(@document) : nil,
        download_url: current ? @context.download_api_pdf_document_path(@document) : nil,
        thumbnail_url: thumbnail_url,
        created_at: @document.created_at,
        updated_at: @document.updated_at
      }
    end

    private

    def thumbnail_url
      return unless @document.thumbnail.attached?

      @context.rails_blob_path(@document.thumbnail, only_path: true)
    end
  end
end
