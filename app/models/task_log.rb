class TaskLog < ApplicationRecord
  include UserStampable

  belongs_to :task
  belongs_to :developer

  self.inheritance_column = 'non_existent_type_column'

  validates :task, :developer, :log_date, :hours_logged, presence: true
  validates :hours_logged, numericality: true
end
