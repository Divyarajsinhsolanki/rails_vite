class KnowledgePromptRun < ApplicationRecord
  include WorkspaceScoped

  GENERATION_MODES = %w[history replace_topic replace_all].freeze
  STATUSES = %w[completed partial failed].freeze

  belongs_to :user, inverse_of: :knowledge_prompt_runs
  belongs_to :mcp_access_token, optional: true
  has_many :knowledge_items, dependent: :destroy, inverse_of: :knowledge_prompt_run

  validates :prompt, :source, :generation_mode, :status, presence: true
  validates :generation_mode, inclusion: { in: GENERATION_MODES }
  validates :status, inclusion: { in: STATUSES }

  before_validation :assign_defaults

  private

  def assign_defaults
    self.source = "mcp" if source.blank?
    self.generation_mode = "history" if generation_mode.blank?
    self.status = "completed" if status.blank?
    self.metadata ||= {}
  end
end
