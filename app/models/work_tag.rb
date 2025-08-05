class WorkTag < ApplicationRecord
  include UserStampable

  has_many :work_log_tags, dependent: :destroy
  has_many :work_logs, through: :work_log_tags

  validates :name, presence: true, uniqueness: true
end
