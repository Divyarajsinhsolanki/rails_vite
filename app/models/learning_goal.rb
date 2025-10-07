class LearningGoal < ApplicationRecord
  belongs_to :user
  belongs_to :team, optional: true
  has_many :learning_checkpoints, dependent: :destroy

  validates :title, presence: true
  validates :progress, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 100 }

  scope :ordered, -> { order(:due_date, :created_at) }

  def recalculate_progress!
    total = learning_checkpoints.count
    completed = learning_checkpoints.where(completed: true).count
    new_progress = total.zero? ? 0 : ((completed.to_f / total) * 100).round
    update_columns(progress: new_progress)
  end

  def due_in_days
    return nil unless due_date

    (due_date - Date.current).to_i
  end
end
