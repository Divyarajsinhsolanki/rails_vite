class Item < ApplicationRecord
  belongs_to :user, inverse_of: :items

  validates :title, presence: true
  validates :content, presence: true
end
