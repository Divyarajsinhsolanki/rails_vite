class Sprint < ApplicationRecord
  include UserStampable
  include WorkspaceScoped

  belongs_to :project, inverse_of: :sprints
  has_many :tasks, dependent: :nullify, inverse_of: :sprint
  has_many :calendar_events, dependent: :nullify
end
