module UserStampable
  extend ActiveSupport::Concern

  included do
    before_create :set_created_by, :set_updated_by
    before_update :set_updated_by
  end

  private

  def set_created_by
    if self.respond_to?(:created_by=) && User.current_user
      self.created_by ||= User.current_user.try(:id)
    end
  end

  def set_updated_by
    if self.respond_to?(:updated_by=) && User.current_user
      self.updated_by = User.current_user.try(:id)
    end
  end
end