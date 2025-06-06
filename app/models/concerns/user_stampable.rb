module UserStampable
  extend ActiveSupport::Concern

  included do
    before_create :set_created_by, :set_updated_by
    before_update :set_updated_by
  end

  private

  def set_created_by
    self.created_by ||= User.current_user.try(:id) if User.current_user
  end

  def set_updated_by
    self.updated_by = User.current_user.try(:id) if User.current_user
  end
end