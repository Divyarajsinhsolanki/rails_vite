# Keep the default seed intentionally small and safe for every environment.
# `app:bootstrap` composes this baseline with portfolio and synthetic demo data.

Role::NAMES.each { |name| Role.find_or_create_by!(name: name) }

Workspace.find_or_create_by!(slug: "private-workspace") do |workspace|
  workspace.name = "Private Workspace"
  workspace.kind = "private"
end

puts "Seeded baseline roles and the private workspace."
