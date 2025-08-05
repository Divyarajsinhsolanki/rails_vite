class WorkCategory < ApplicationRecord
  include UserStampable

  has_many :work_logs, dependent: :nullify

  validates :name, presence: true
end
