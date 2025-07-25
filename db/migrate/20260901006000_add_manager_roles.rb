class AddManagerRoles < ActiveRecord::Migration[7.1]
  def up
    %w[project_manager team_leader].each do |name|
      Role.find_or_create_by!(name: name)
    end
  end

  def down
    Role.where(name: %w[project_manager team_leader]).delete_all
  end
end
