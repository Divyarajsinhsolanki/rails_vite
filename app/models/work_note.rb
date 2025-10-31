class WorkNote < ApplicationRecord
  include UserStampable

  belongs_to :user, inverse_of: :work_notes

  validates :note_date, presence: true
end
