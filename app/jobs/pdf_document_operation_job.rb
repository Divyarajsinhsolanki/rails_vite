class PdfDocumentOperationJob < ApplicationJob
  queue_as :default

  def perform(operation_id)
    operation = PdfDocumentOperation.unscoped.find(operation_id)
    Current.user = operation.user
    Current.workspace = operation.workspace
    PdfDocuments::OperationRunner.new(operation).run!
  ensure
    Current.reset_all
  end
end
