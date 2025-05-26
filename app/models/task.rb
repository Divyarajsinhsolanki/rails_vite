class Task < ApplicationRecord
  belongs_to :sprint, optional: true
  belongs_to :developer

  validates :task_id,  presence: true
  validates :date,     presence: true
  validates :developer, presence: true
  validates :task_type, presence: true
end
