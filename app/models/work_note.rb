class WorkNote < ApplicationRecord
  include UserStampable
  include WorkspaceScoped

  belongs_to :user, inverse_of: :work_notes

  validates :note_date, presence: true
end
