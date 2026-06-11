namespace :demo do
  desc "Create or refresh the synthetic read-only demo workspace (never private data)"
  task seed: :environment do
    workspace = DemoWorkspaceSeeder.new.call
    puts "Seeded demo workspace: #{workspace.name} (#{workspace.slug})"
  end
end
