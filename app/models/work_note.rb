class WorkNote < ApplicationRecord
  include UserStampable

  belongs_to :user

  validates :note_date, presence: true
end
