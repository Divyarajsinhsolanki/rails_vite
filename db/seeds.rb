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

# Default Work Priorities
[
  { name: 'High', color: 'bg-red-500', hex: '#ef4444' },
  { name: 'Medium', color: 'bg-yellow-500', hex: '#f59e0b' },
  { name: 'Low', color: 'bg-green-500', hex: '#10b981' }
].each do |priority|
  WorkPriority.find_or_create_by!(name: priority[:name]) do |p|
    p.color = priority[:color]
    p.hex = priority[:hex]
  end
end

# Default Work Categories
[
  { name: 'Development', color: 'bg-blue-500', hex: '#3b82f6' },
  { name: 'Meeting', color: 'bg-green-500', hex: '#22c55e' },
  { name: 'Research', color: 'bg-purple-500', hex: '#a855f7' },
  { name: 'Design', color: 'bg-pink-500', hex: '#ec4899' },
  { name: 'Code Review', color: 'bg-indigo-500', hex: '#6366f1' },
  { name: 'Break', color: 'bg-yellow-500', hex: '#eab308' },
  { name: 'Learning', color: 'bg-teal-500', hex: '#14b8a6' },
  { name: 'Planning', color: 'bg-amber-500', hex: '#f59e0b' }
].each do |category|
  WorkCategory.find_or_create_by!(name: category[:name]) do |c|
    c.color = category[:color]
    c.hex = category[:hex]
  end
end

# Default Work Tags
[
  'Team',
  'Sync',
  'Frontend',
  'React',
  'UI/UX',
  'Figma',
  'Backend',
  'Code Review',
  'Frontend',
  'Research'
].each do |tag_name|
  WorkTag.find_or_create_by!(name: tag_name)
end
