class ConversationParticipant < ApplicationRecord
  include WorkspaceScoped

  belongs_to :conversation
  belongs_to :user

  validates :user_id, uniqueness: { scope: :conversation_id }
end
