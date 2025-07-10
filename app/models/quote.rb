class Quote < ApplicationRecord
  validates :content, presence: true
end
