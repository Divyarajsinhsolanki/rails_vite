class MessageReaction < ApplicationRecord
  EMOJIS = %w[👍 ❤️ 🎉].freeze

  belongs_to :message
  belongs_to :user

  validates :emoji, presence: true, inclusion: { in: EMOJIS }
  validates :emoji, uniqueness: { scope: [:message_id, :user_id] }

  after_create_commit -> { broadcast_reactions_updated("added") }
  after_destroy_commit -> { broadcast_reactions_updated("removed") }

  private

  def broadcast_reactions_updated(action)
    Chat::Broadcaster.broadcast_message_reactions_updated(
      message,
      last_actor_id: user_id,
      last_actor_emoji: emoji,
      last_actor_action: action
    )
  end
end
