class PurgePdfDocumentArtifactsJob < ApplicationJob
  queue_as :default

  def perform
    PdfDocumentArtifact.unscoped.expired.find_each(&:destroy!)
  end
end
