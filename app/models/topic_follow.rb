class TopicFollow < ApplicationRecord
  belongs_to :user
  belongs_to :topic, counter_cache: true

  validates :user_id, uniqueness: { scope: :topic_id }
end
