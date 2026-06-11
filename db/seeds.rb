# Keep the default seed intentionally small and safe for every environment.
# Portfolio and demo content are seeded explicitly with portfolio:seed and demo:seed.

Role::NAMES.each { |name| Role.find_or_create_by!(name: name) }

Workspace.find_or_create_by!(slug: "private-workspace") do |workspace|
  workspace.name = "Private Workspace"
  workspace.kind = "private"
end

puts "Seeded baseline roles and the private workspace."
