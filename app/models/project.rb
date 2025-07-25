class Project < ApplicationRecord
  belongs_to :owner, class_name: 'User', optional: true

  has_many :project_users, dependent: :destroy
  has_many :users, through: :project_users
  has_many :sprints, dependent: :destroy

  enum status: {
    upcoming: 'upcoming',
    running: 'running',
    completed: 'completed'
  }, _default: 'running'

  validates :name, presence: true

  before_save :set_status_from_dates

  private

  def set_status_from_dates
    return self.status = 'running' if start_date.blank?

    if end_date.present? && Date.current > end_date
      self.status = 'completed'
    elsif Date.current < start_date
      self.status = 'upcoming'
    else
      self.status = 'running'
    end
  end
end
