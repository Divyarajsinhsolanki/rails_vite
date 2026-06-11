namespace :portfolio do
  desc "Create or refresh the published portfolio with synthetic showcase content"
  task seed: :environment do
    profile = PortfolioSeeder.new.call
    puts "Seeded portfolio for #{profile.full_name}."
  end
end
