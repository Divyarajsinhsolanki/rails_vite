class WorkLog < ApplicationRecord
  include UserStampable

  belongs_to :user
  belongs_to :category, class_name: 'WorkCategory', optional: true
  belongs_to :priority, class_name: 'WorkPriority', optional: true

  has_many :work_log_tags, dependent: :destroy
  has_many :tags, through: :work_log_tags, source: :work_tag, class_name: 'WorkTag'

  validates :title, :log_date, :start_time, :end_time, presence: true
end
