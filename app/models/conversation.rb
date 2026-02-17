class Conversation < ApplicationRecord
  enum conversation_type: { direct: "direct", group: "group" }, _prefix: :conversation

  belongs_to :creator, class_name: "User"
  has_many :conversation_participants, dependent: :destroy
  has_many :participants, through: :conversation_participants, source: :user
  has_many :messages, dependent: :destroy

  validates :conversation_type, presence: true
  validates :title, presence: true, if: :group?

  scope :for_user, ->(user) { joins(:conversation_participants).where(conversation_participants: { user_id: user.id }).distinct }

  def direct?
    conversation_type == "direct"
  end

  def group?
    conversation_type == "group"
  end

  def display_name(for_user)
    return title if group?

    other_participant = participants.where.not(id: for_user.id).first
    other_participant&.full_name || "Direct chat"
  end
end
