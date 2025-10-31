class Developer < ApplicationRecord
  include UserStampable

  has_many :tasks, dependent: :nullify, inverse_of: :developer
  has_many :task_logs, dependent: :destroy, inverse_of: :developer
  has_many :projects, -> { distinct }, through: :tasks, source: :project
end
