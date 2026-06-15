class Api::PdfDocumentOperationsController < Api::BaseController
  before_action :set_operation, only: :show

  def show
    render json: serialize_operation(@operation)
  end

  def create
    kind = params.require(:kind).to_s
    raise ArgumentError, "Unsupported PDF operation." unless PdfDocuments::OperationRunner::ALLOWED_KINDS.include?(kind)

    document = document_for_operation(kind)
    base_version_id = params[:base_version_id].presence
    validate_base_version!(document, base_version_id) if document
    parameters = operation_parameters
    raise ArgumentError, "Operation parameters are too large." if parameters.to_json.bytesize > 1.megabyte

    operation = current_user.pdf_document_operations.create!(
      workspace: current_user.workspace,
      pdf_document: document,
      base_version_id:,
      kind:,
      parameters: parameters.except("password")
    )

    if PdfDocuments::OperationRunner::ASYNC_KINDS.include?(kind)
      PdfDocumentOperationJob.perform_later(operation.id)
      render json: serialize_operation(operation), status: :accepted
    else
      PdfDocuments::OperationRunner.new(operation).run!(
        password: params[:password],
        asset: params[:asset]
      )
      render json: serialize_operation(operation.reload), status: :created
    end
  rescue PdfDocuments::Manager::StaleVersion => e
    render json: { error: e.message }, status: :conflict
  rescue ActiveRecord::RecordNotFound
    render json: { error: "PDF document was not found." }, status: :not_found
  rescue ArgumentError, KeyError, PdfDocuments::Manager::QuotaExceeded => e
    render json: { error: e.message }, status: :unprocessable_content
  end

  private

  def set_operation
    @operation = current_user.pdf_document_operations.find(params[:id])
  end

  def document_for_operation(kind)
    return if kind == "merge"

    current_user.pdf_documents.find(params.require(:pdf_document_id))
  end

  def validate_base_version!(document, base_version_id)
    raise ArgumentError, "base_version_id is required." if base_version_id.blank?
    return if document.current_version_id == base_version_id.to_i

    raise PdfDocuments::Manager::StaleVersion,
          "Document changed in another request. Reload and try again."
  end

  def operation_parameters
    raw = params[:parameters]
    return {} if raw.blank?

    return JSON.parse(raw) if raw.is_a?(String)

    raw.is_a?(ActionController::Parameters) ? raw.to_unsafe_h : raw.to_h
  rescue JSON::ParserError
    raise ArgumentError, "Operation parameters are invalid."
  end

  def serialize_operation(operation)
    artifacts = operation.artifacts.includes(file_attachment: :blob).map do |artifact|
      {
        id: artifact.id,
        kind: artifact.kind,
        filename: artifact.file.filename.to_s,
        byte_size: artifact.file.byte_size,
        expires_at: artifact.expires_at,
        url: rails_blob_path(artifact.file, only_path: true),
        download_url: rails_blob_path(artifact.file, disposition: "attachment", only_path: true)
      }
    end

    {
      id: operation.id,
      kind: operation.kind,
      status: operation.status,
      progress: operation.progress,
      error: operation.error_message,
      result: operation.result,
      artifacts: artifacts,
      document: operation.pdf_document ? PdfDocuments::Serializer.new(operation.pdf_document.reload, context: self).as_json : nil,
      created_at: operation.created_at,
      completed_at: operation.completed_at
    }
  end
end
