class Workspace < ApplicationRecord
  KINDS = %w[private demo].freeze

  has_many :users, dependent: :destroy
  has_many :projects, dependent: :destroy
  has_many :teams, dependent: :destroy

  validates :name, :slug, :kind, presence: true
  validates :slug, uniqueness: true
  validates :kind, inclusion: { in: KINDS }

  before_validation :normalize_slug

  def demo?
    kind == "demo"
  end

  private

  def normalize_slug
    self.slug = name.to_s.parameterize if slug.blank?
  end
end
