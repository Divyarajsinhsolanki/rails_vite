class Task < ApplicationRecord
  include UserStampable

  belongs_to :sprint, optional: true, inverse_of: :tasks
  belongs_to :developer, optional: true, inverse_of: :tasks
  belongs_to :project, optional: true, inverse_of: :tasks
  belongs_to :assigned_user, class_name: 'User', foreign_key: :assigned_to_user, optional: true, inverse_of: :tasks

  has_many :task_logs, dependent: :destroy, inverse_of: :task

  # This tells ActiveRecord NOT to use the 'type' column for Single Table Inheritance.
  self.inheritance_column = 'non_existent_type_column'

  validates :task_id, presence: true, unless: :general?
  validates :developer, presence: true, unless: :general?
  validates :type, presence: true
  validates :title, presence: true, if: :general?

  private

  def general?
    type == 'general' || type == 'qa'
  end
end
