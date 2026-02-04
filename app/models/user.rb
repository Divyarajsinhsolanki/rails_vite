class User < ApplicationRecord
  include UserStampable

  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable, :confirmable

  enum status: { invited: "invited", active: "active", locked: "locked" }, _default: "invited"

  LANDING_PAGES = %w[posts profile vault knowledge worklog projects teams].freeze
  AVAILABILITY_LABELS = {
    'available_now' => 'Available Now',
    'available_soon' => 'Available in 2 weeks',
    'fully_booked' => 'Fully Booked'
  }.freeze
  NOTIFICATION_PREFERENCES_DEFAULTS = {
    "commented" => true,
    "assigned" => true,
    "update" => true,
    "digest" => false
  }.freeze

  has_one_attached :profile_picture
  has_one_attached :cover_photo
  has_many :posts, dependent: :destroy, inverse_of: :user
  has_many :tasks, foreign_key: :assigned_to_user, inverse_of: :assigned_user
  has_many :items, inverse_of: :user
  has_many :comments, dependent: :destroy, inverse_of: :user
  has_many :work_logs, dependent: :destroy, inverse_of: :user
  has_many :work_notes, dependent: :destroy, inverse_of: :user
  has_many :post_likes, dependent: :destroy, inverse_of: :user
  has_many :liked_posts, through: :post_likes, source: :post
  has_many :team_users, dependent: :destroy, inverse_of: :user
  has_many :teams, through: :team_users
  has_many :owned_teams, class_name: 'Team', foreign_key: :owner_id, inverse_of: :owner, dependent: :nullify
  has_many :user_roles, dependent: :destroy, inverse_of: :user
  has_many :roles, through: :user_roles
  has_many :project_users, dependent: :destroy, inverse_of: :user
  has_many :projects, through: :project_users
  has_many :owned_projects, class_name: 'Project', foreign_key: :owner_id, inverse_of: :owner, dependent: :nullify
  has_many :user_skills, dependent: :destroy
  has_many :skills, through: :user_skills
  has_many :learning_goals, dependent: :destroy, inverse_of: :user
  has_many :knowledge_bookmarks, dependent: :destroy, inverse_of: :user
  has_many :given_skill_endorsements, class_name: 'SkillEndorsement', foreign_key: :endorser_id, dependent: :destroy, inverse_of: :endorser
  has_many :received_skill_endorsements, through: :user_skills, source: :skill_endorsements
  has_many :notifications, foreign_key: :recipient_id, dependent: :destroy
  belongs_to :department, optional: true

  enum availability_status: {
    available_now: 'available_now',
    available_soon: 'available_soon',
    fully_booked: 'fully_booked'
  }, _default: 'available_now'

  validates :first_name, presence: true
  validates :last_name, presence: true
  validates :landing_page, inclusion: { in: LANDING_PAGES }
  validates :job_title, presence: true
  validates :availability_status, inclusion: { in: availability_statuses.keys }

  after_create :assign_default_role

  def has_role?(name)
    roles.exists?(name: name.to_s)
  end

  def owner?
    has_role?(:owner)
  end

  def admin?
    has_role?(:admin)
  end

  def member?
    has_role?(:member)
  end

  def project_manager?
    has_role?(:project_manager)
  end

  def team_leader?
    has_role?(:team_leader)
  end

  def full_name
    [first_name, last_name].compact_blank.join(' ')
  end

  def availability_label
    AVAILABILITY_LABELS[availability_status] || availability_status.to_s.humanize
  end

  def notification_preferences_with_defaults
    NOTIFICATION_PREFERENCES_DEFAULTS.merge((notification_preferences || {}).stringify_keys)
  end

  def notification_preference_enabled?(action)
    notification_preferences_with_defaults.fetch(action.to_s, true)
  end

  private

  def after_confirmation
    update_column(:status, "active")
  end

  def assign_default_role
    roles << Role.find_by(name: 'member') if roles.empty?
  end
end
