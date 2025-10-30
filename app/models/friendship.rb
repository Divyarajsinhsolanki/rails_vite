class Friendship < ApplicationRecord
  belongs_to :follower, class_name: 'User'
  belongs_to :followed, class_name: 'User'

  validates :follower_id, uniqueness: { scope: :followed_id }
  validate :prevent_self_follow

  scope :between, ->(user, other_user) {
    where(follower: user, followed: other_user)
  }

  private

  def prevent_self_follow
    errors.add(:followed_id, 'cannot be the same as follower') if follower_id == followed_id
  end
end
