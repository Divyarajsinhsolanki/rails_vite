class Department < ApplicationRecord
  belongs_to :manager, class_name: "User", optional: true
  has_many :users, dependent: :nullify

  validates :name, presence: true, uniqueness: true
end
