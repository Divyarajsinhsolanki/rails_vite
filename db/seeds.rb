# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).
#
# Example:
#
#   ["Action", "Comedy", "Drama", "Horror"].each do |genre_name|
#     MovieGenre.find_or_create_by!(name: genre_name)
#   end

# Default Roles
%w[owner admin member].each do |name|
  Role.find_or_create_by!(name: name)
end

# Default Teams
%w[ROR React Python QA DevOps Design].each do |name|
  Team.find_or_create_by!(name: name)
end

# Default Projects
[
  "MyForms",
  "AI",
  "AC Space",
  "Portal",
  "DataHub"
].each do |name|
  Project.find_or_create_by!(name: name)
end
