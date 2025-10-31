class Sprint < ApplicationRecord
  include UserStampable

  belongs_to :project, inverse_of: :sprints
  has_many :tasks, dependent: :nullify, inverse_of: :sprint
end