class Task < ApplicationRecord
  include UserStampable

  belongs_to :sprint, optional: true
  belongs_to :developer

  # This tells ActiveRecord NOT to use the 'type' column for Single Table Inheritance.
  self.inheritance_column = 'non_existent_type_column'

  validates :task_id,  presence: true
  validates :date,     presence: true
  validates :developer, presence: true
  validates :type, presence: true
end
