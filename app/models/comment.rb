class Comment < ApplicationRecord
  include UserStampable

  belongs_to :post, counter_cache: true, inverse_of: :comments
  belongs_to :user, inverse_of: :comments

  validates :body, presence: true
end
