class SkillEndorsement < ApplicationRecord
  belongs_to :user_skill, counter_cache: :endorsements_count, inverse_of: :skill_endorsements
  belongs_to :endorser, class_name: 'User', inverse_of: :given_skill_endorsements
  belongs_to :team, optional: true, inverse_of: :skill_endorsements

  delegate :user, :skill, to: :user_skill

  validates :endorser_id, uniqueness: { scope: :user_skill_id }
  validate :cannot_endorse_self

  after_commit :refresh_last_endorsed_at, on: :create
  after_commit :sync_last_endorsed_at, on: :destroy

  private

  def cannot_endorse_self
    errors.add(:base, 'You cannot endorse your own skill') if user_skill.user_id == endorser_id
  end

  def refresh_last_endorsed_at
    user_skill.update_columns(last_endorsed_at: Time.current)
  end

  def sync_last_endorsed_at
    timestamp = user_skill.skill_endorsements.maximum(:created_at)
    user_skill.update_columns(last_endorsed_at: timestamp)
  end
end
