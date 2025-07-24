class AddDefaultRoles < ActiveRecord::Migration[7.1]
  def up
    %w[owner admin member].each do |name|
      Role.find_or_create_by!(name: name)
    end
  end

  def down
    Role.where(name: %w[owner admin member]).delete_all
  end
end
