class LearningCheckpoint < ApplicationRecord
  belongs_to :learning_goal, inverse_of: :learning_checkpoints

  validates :title, presence: true

  after_commit :refresh_goal_progress

  scope :completed, -> { where(completed: true) }

  private

  def refresh_goal_progress
    learning_goal.recalculate_progress!
  end
end
