class Task < ApplicationRecord
  include UserStampable

  belongs_to :sprint, optional: true
  belongs_to :developer
  belongs_to :assigned_user, class_name: 'User', foreign_key: :assigned_to_user, optional: true

  # This tells ActiveRecord NOT to use the 'type' column for Single Table Inheritance.
  self.inheritance_column = 'non_existent_type_column'

  validates :task_id,  presence: true
  validates :developer, presence: true
  validates :type, presence: true
end
