class PdfDocumentArtifact < ApplicationRecord
  include WorkspaceScoped

  belongs_to :user, inverse_of: :pdf_document_artifacts
  belongs_to :pdf_document, optional: true, inverse_of: :artifacts
  belongs_to :pdf_document_operation, optional: true, inverse_of: :artifacts
  has_one_attached :file

  validates :kind, :expires_at, presence: true

  scope :expired, -> { where("expires_at <= ?", Time.current) }

end
