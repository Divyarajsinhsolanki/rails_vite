class UserSkill < ApplicationRecord
  belongs_to :user
  belongs_to :skill
  has_many :skill_endorsements, dependent: :destroy

  PROFICIENCY_LEVELS = %w[beginner intermediate advanced expert].freeze

  validates :proficiency, inclusion: { in: PROFICIENCY_LEVELS }
  validates :user_id, uniqueness: { scope: :skill_id }

  scope :with_skill, -> { includes(:skill) }
  scope :ordered_by_skill_name, -> { joins(:skill).order('LOWER(skills.name) ASC') }

  def proficiency_label
    proficiency.titleize
  end

  def name
    skill.name
  end

  def endorsed_by?(endorser)
    skill_endorsements.any? { |endorsement| endorsement.endorser_id == endorser.id }
  end
end
