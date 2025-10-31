class PostLike < ApplicationRecord
  belongs_to :post, inverse_of: :post_likes
  belongs_to :user, inverse_of: :post_likes

  validates :user_id, uniqueness: { scope: :post_id }
end
