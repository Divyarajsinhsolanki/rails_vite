class Skill < ApplicationRecord
  has_many :user_skills, dependent: :destroy, inverse_of: :skill
  has_many :users, through: :user_skills

  validates :name, presence: true, uniqueness: { case_sensitive: false }

  before_validation :normalize_name

  scope :alphabetical, -> { order(Arel.sql('LOWER(name)')) }

  private

  def normalize_name
    self.name = name.to_s.strip.titleize if name.present?
  end
end
