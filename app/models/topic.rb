class Topic < ApplicationRecord
  has_many :topic_follows, dependent: :destroy
  has_many :followers, through: :topic_follows, source: :user

  validates :name, presence: true, uniqueness: true

  scope :alphabetical, -> { order(:name) }

  def self.suggested_for(user, limit: 8)
    scope = order(topic_follows_count: :desc, name: :asc)
    if user&.persisted?
      followed_ids = user.topic_follows.select(:topic_id)
      scope = scope.where.not(id: followed_ids)
    end
    scope.limit(limit)
  end

  def follows_count
    topic_follows_count
  end

  def followed_by?(user)
    return false unless user

    user.following_topic?(self)
  end
end
