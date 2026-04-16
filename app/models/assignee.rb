class Assignee < ApplicationRecord
  include UserStampable

  self.inheritance_column = :_type_disabled

  ROLE_TYPES = %w[developer qa devops designer analyst product_manager support other].freeze

  has_many :tasks, dependent: :nullify, foreign_key: :developer_id, inverse_of: :developer
  has_many :task_logs, dependent: :destroy, foreign_key: :developer_id, inverse_of: :developer
  has_many :projects, -> { distinct }, through: :tasks, source: :project

  validates :name, presence: true, uniqueness: true
  validates :role_type, inclusion: { in: ROLE_TYPES }
end
