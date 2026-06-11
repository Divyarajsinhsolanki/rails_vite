module WorkspaceScoped
  extend ActiveSupport::Concern

  included do
    belongs_to :workspace

    default_scope lambda {
      Current.workspace ? where(workspace_id: Current.workspace.id) : unscoped
    }

    before_validation :assign_current_workspace, on: :create
    validate :workspace_matches_associations
  end

  private

  def assign_current_workspace
    self.workspace ||= Current.workspace || inferred_workspace
  end

  def inferred_workspace
    self.class.reflect_on_all_associations(:belongs_to).each do |reflection|
      next if reflection.name == :workspace || reflection.polymorphic?

      associated = public_send(reflection.name)
      return associated.workspace if associated&.respond_to?(:workspace)
    end

    nil
  end

  def workspace_matches_associations
    self.class.reflect_on_all_associations(:belongs_to).each do |reflection|
      next if reflection.name == :workspace || reflection.polymorphic?

      associated = public_send(reflection.name)
      next unless associated&.respond_to?(:workspace_id)
      next if associated.workspace_id == workspace_id

      errors.add(reflection.name, "must belong to the same workspace")
    end
  end
end
