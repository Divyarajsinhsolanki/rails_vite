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

# Existing users who will receive seeded data
users = User.all.to_a

if users.empty?
  warn 'No users found. Skipping skill, goal, and endorsement seeding.'
end

# Professional Skills
skill_names = [
  'Ruby on Rails',
  'JavaScript',
  'React',
  'TypeScript',
  'PostgreSQL',
  'Docker',
  'Kubernetes',
  'AWS Architecture',
  'CI/CD Pipelines',
  'Automated Testing',
  'UI/UX Design',
  'Figma',
  'Agile Coaching',
  'Project Planning',
  'API Design',
  'Mobile Development',
  'Data Modeling',
  'Machine Learning',
  'Performance Optimization',
  'Security Auditing'
]

skills = skill_names.map { |name| Skill.find_or_create_by!(name: name) }

rng = Random.new(20_240_519)

# Assign skills to every user with varied proficiency levels
users.each do |user|
  assigned_skills = skills.sample([skills.size, 5].min, random: rng)

  assigned_skills.each do |skill|
    user_skill = UserSkill.find_or_initialize_by(user: user, skill: skill)
    user_skill.proficiency = UserSkill::PROFICIENCY_LEVELS.sample(random: rng)
    user_skill.save!
  end
end

# Create learning goals for each user
goal_templates = [
  { title: 'Improve Automated Testing Coverage', description: 'Increase the project test suite coverage with additional unit and integration tests.', due_in_days: 30, progress_options: [25, 50, 75] },
  { title: 'Master Advanced React Patterns', description: 'Explore and implement advanced patterns in React including hooks and performance optimizations.', due_in_days: 45, progress_options: [0, 25, 50] },
  { title: 'Optimize Database Queries', description: 'Audit slow queries and apply indexing strategies to improve performance.', due_in_days: 40, progress_options: [50, 75, 90] },
  { title: 'Earn AWS Certification', description: 'Study for and pass the AWS Solutions Architect certification.', due_in_days: 60, progress_options: [10, 40, 70] },
  { title: 'Design System Refresh', description: 'Update the component library and align the design system with latest branding.', due_in_days: 35, progress_options: [20, 45, 65] },
  { title: 'Mobile Accessibility Audit', description: 'Conduct an accessibility audit on the mobile app and outline improvements.', due_in_days: 25, progress_options: [30, 55, 80] }
]

users.each do |user|
  goal_templates.sample(3, random: rng).each do |template|
    goal = user.learning_goals.find_or_initialize_by(title: template[:title])
    goal.description = template[:description]
    goal.due_date = Date.current + template[:due_in_days]
    goal.progress = template[:progress_options].sample(random: rng)
    goal.save!
  end
end

# Skill endorsements from peers
endorsement_notes = [
  'Consistently delivers high-quality work.',
  'Great collaborator and always willing to help.',
  'Demonstrates strong ownership of complex tasks.',
  'Shows impressive attention to detail.',
  'A go-to person for mentoring teammates.'
]

users.each do |user|
  user.user_skills.includes(:skill).each do |user_skill|
    potential_endorsers = users.reject { |endorser| endorser == user }
    next if potential_endorsers.empty?

    max_endorsements = [potential_endorsers.size, 3].min
    endorsement_count = max_endorsements.zero? ? 0 : rng.rand(1..max_endorsements)
    next if endorsement_count.zero?

    potential_endorsers.sample(endorsement_count, random: rng).each do |endorser|
      SkillEndorsement.find_or_create_by!(user_skill: user_skill, endorser: endorser) do |endorsement|
        endorsement.note = endorsement_notes.sample(random: rng)
      end
    end
  end
end
