class User < ApplicationRecord
  before_create :set_jti

  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable
  # has_secure_password

  generates_token_for :auth, expires_in: 24.hours

  has_one_attached :profile_picture
  has_many :posts

  def revoke_token_for(auth_scope)
    update!(jti: SecureRandom.uuid)
  end

  private

  def set_jti
    self.jti = SecureRandom.uuid
  end
end
