require "tempfile"

module PdfDocuments
  class Manager
    class QuotaExceeded < StandardError; end
    class StaleVersion < StandardError; end

    def self.create_from_upload!(user:, upload:, title: nil)
      raise ArgumentError, "Choose a PDF file" unless upload.respond_to?(:original_filename)
      raise ArgumentError, "PDF must be 50MB or smaller" if upload.size.to_i > PdfDocument::MAX_UPLOAD_SIZE

      with_uploaded_pdf(upload) do |path|
        create_from_path!(
          user:,
          path:,
          filename: upload.original_filename,
          title: title.presence
        )
      end
    end

    def self.create_from_path!(user:, path:, filename:, title: nil, operation: "upload")
      inspection = Inspector.call(path)
      filename = sanitize_filename(filename)

      PdfDocument.transaction do
        user.lock!
        ensure_document_slot!(user)
        ensure_storage!(user, inspection.byte_size)

        document = user.pdf_documents.create!(
          workspace: user.workspace,
          title: title.presence || File.basename(filename, ".pdf"),
          original_filename: filename,
          page_count: inspection.page_count,
          encrypted: inspection.encrypted
        )
        version = attach_version!(
          document:,
          created_by: user,
          path:,
          operation:,
          version_number: 1,
          parent_version: nil,
          inspection:
        )
        document.update!(current_version: version)
        refresh_thumbnail!(document)
        document
      end
    end

    def self.append_version!(document:, created_by:, path:, operation:, base_version_id:, metadata: {})
      inspection = Inspector.call(path)

      PdfDocument.transaction do
        created_by.lock!
        document.lock!
        raise StaleVersion, "Document changed in another request. Reload and try again." unless document.current_version_id == base_version_id.to_i

        redo_versions = document.versions.where("version_number > ?", document.current_version.version_number)
        reclaimed_bytes = redo_versions.sum(:byte_size)
        next_number = document.current_version.version_number + 1
        prune_candidates = document.versions
          .where.not(version_number: 1)
          .where.not(id: redo_versions.select(:id))
          .reorder(version_number: :desc)
          .offset(PdfDocument::MAX_EDIT_VERSIONS - 1)
        reclaimed_bytes += prune_candidates.sum(:byte_size)

        ensure_storage!(created_by, inspection.byte_size, reclaim_bytes: reclaimed_bytes)
        redo_versions.destroy_all

        version = attach_version!(
          document:,
          created_by:,
          path:,
          operation:,
          version_number: next_number,
          parent_version: document.current_version,
          inspection:,
          metadata:
        )
        document.update!(
          current_version: version,
          page_count: inspection.page_count,
          encrypted: inspection.encrypted
        )
        prune_old_versions!(document)
        refresh_thumbnail!(document)
        version
      end
    end

    def self.move_history!(document:, target_version:)
      document.with_lock do
        raise ArgumentError, "Version does not belong to this document" unless target_version.pdf_document_id == document.id

        document.update!(
          current_version: target_version,
          page_count: target_version.page_count,
          encrypted: target_version.encrypted
        )
        refresh_thumbnail!(document)
      end
      target_version
    end

    def self.user_usage(user)
      {
        document_count: user.pdf_documents.count,
        document_limit: PdfDocument::MAX_DOCUMENTS_PER_USER,
        storage_bytes: PdfDocument.storage_bytes_for(user),
        storage_limit_bytes: PdfDocument::MAX_STORAGE_PER_USER
      }
    end

    def self.refresh_thumbnail!(document)
      document.thumbnail.purge if document.respond_to?(:thumbnail) && document.thumbnail.attached?
      return if document.encrypted? || document.current_version.blank?

      document.current_version.file.open do |source|
        Dir.mktmpdir("pdf-thumbnail") do |directory|
          prefix = File.join(directory, "thumbnail")
          success = system("pdftoppm", "-f", "1", "-singlefile", "-scale-to", "360", "-png",
                           source.path, prefix, out: File::NULL, err: File::NULL)
          image_path = "#{prefix}.png"
          return unless success && File.file?(image_path)

          document.thumbnail.attach(
            io: File.open(image_path, "rb"),
            filename: "#{File.basename(document.original_filename, ".pdf")}.png",
            content_type: "image/png"
          )
        end
      end
    rescue StandardError => e
      Rails.logger.warn("[PDF] Thumbnail generation failed for document #{document.id}: #{e.class}")
    end

    def self.ensure_document_slot!(user, additional: 1)
      return if user.pdf_documents.count + additional <= PdfDocument::MAX_DOCUMENTS_PER_USER

      raise QuotaExceeded, "Personal PDF library is limited to #{PdfDocument::MAX_DOCUMENTS_PER_USER} documents."
    end

    def self.ensure_storage!(user, additional_bytes, reclaim_bytes: 0)
      projected = PdfDocument.storage_bytes_for(user) - reclaim_bytes.to_i + additional_bytes.to_i
      return if projected <= PdfDocument::MAX_STORAGE_PER_USER

      raise QuotaExceeded, "Personal PDF storage is limited to 1GB."
    end

    def self.sanitize_filename(filename)
      base = File.basename(filename.to_s).gsub(/[^0-9A-Za-z. _-]/, "")
      base = "document.pdf" if base.blank?
      base = "#{base}.pdf" unless base.downcase.end_with?(".pdf")
      base.first(255)
    end

    def self.with_uploaded_pdf(upload)
      Tempfile.create(["pdf-upload-", ".pdf"], binmode: true) do |tempfile|
        upload.rewind if upload.respond_to?(:rewind)
        IO.copy_stream(upload, tempfile)
        tempfile.flush
        yield tempfile.path
      ensure
        upload.rewind if upload.respond_to?(:rewind)
      end
    end

    def self.attach_version!(document:, created_by:, path:, operation:, version_number:,
                             parent_version:, inspection:, metadata: {})
      version = document.versions.create!(
        workspace: document.workspace,
        created_by:,
        parent_version:,
        version_number:,
        operation:,
        page_count: inspection.page_count,
        encrypted: inspection.encrypted,
        byte_size: inspection.byte_size,
        metadata:
      )
      version.file.attach(
        io: File.open(path, "rb"),
        filename: document.original_filename,
        content_type: "application/pdf",
        identify: false
      )
      version
    rescue StandardError
      version&.destroy
      raise
    end

    def self.prune_old_versions!(document)
      document.versions
        .where.not(version_number: 1)
        .reorder(version_number: :desc)
        .offset(PdfDocument::MAX_EDIT_VERSIONS)
        .destroy_all
    end

    private_class_method :with_uploaded_pdf, :attach_version!, :prune_old_versions!
  end
end
