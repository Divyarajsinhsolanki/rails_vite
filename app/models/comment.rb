class Comment < ApplicationRecord
  include UserStampable

  belongs_to :post, counter_cache: true
  belongs_to :user

  validates :body, presence: true
end
