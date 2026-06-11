class PortfolioSeeder
  FEATURES = [
    ["Project Delivery", "Projects, Sprints, and Quality", "Plan delivery with project membership, sprint scheduling, Kanban tasks, statistics, issue tracking, Sheet imports, and protected vault data.", "/projects"],
    ["Planning and Focus", "Calendar and Daily Momentum", "Connect deadlines, recurring events, reminders, daily priorities, work logs, notes, weekly reviews, and focused Pomodoro sessions.", "/momentum"],
    ["Collaboration", "Teams, Posts, and Real-time Chat", "Coordinate departments, skills, learning goals, social updates, direct and group conversations, mentions, reactions, and notifications.", "/posts"],
    ["Knowledge", "Knowledge and Learning Grid", "Collect coding guidance, language practice, external signals, bookmarks, reminders, learning checkpoints, and immersive 3D views.", "/knowledge"],
    ["Documents", "PDF Master Workflows", "Upload, annotate, sign, watermark, stamp, merge, split, compress, protect, export, undo, and redo PDF documents.", "/pdf-master"],
    ["Platform", "Full-stack Product Engineering", "A Rails API and React application with JWT cookies, role authorization, background jobs, Action Cable, Active Storage, integrations, and production tooling.", "/demo#architecture"]
  ].freeze
  SCREENSHOT_FILENAMES = %w[
    01-project-delivery.webp
    02-planning-focus.webp
    03-collaboration.webp
    04-knowledge-learning.webp
    05-pdf-workflows.webp
    06-platform-engineering.webp
  ].freeze

  def call
    profile = PortfolioProfile.first_or_initialize
    profile.update!(
      full_name: "Divyarajsinh Solanki",
      headline: "Full-stack engineer building practical Rails and React products",
      location: "India",
      summary: "I design and build product-focused web applications from database modeling and secure APIs through responsive interfaces, real-time collaboration, integrations, and deployment.",
      skills: ["Ruby on Rails", "React", "JavaScript", "PostgreSQL", "Tailwind CSS", "REST APIs", "Action Cable", "Active Storage", "Docker"],
      metrics: ["40+ domain migrations", "35+ API controllers", "20+ product surfaces", "Rails 7.1 + React 18"],
      social_links: { github: "https://github.com/Divyarajsinhsolanki", linkedin: "", website: "" },
      architecture: ["React and Vite client", "Rails JSON API", "PostgreSQL data model", "JWT cookie sessions", "Action Cable realtime updates", "Active Job and Active Storage"],
      engineering_highlights: ["Workspace-aware authorization", "Project and sprint planning", "Realtime chat and notifications", "Calendar recurrence and reminders", "PDF processing workflows", "External API integrations"],
      published: true
    )

    project = PortfolioProject.find_or_initialize_by(slug: "nexus-hub")
    project.update!(
      title: "Nexus Hub",
      tagline: "A connected workspace for planning, delivery, collaboration, knowledge, and document workflows.",
      summary: "Nexus Hub is a full-stack Rails and React product that brings project operations, personal productivity, team communication, learning tools, and PDF workflows into one application.",
      description: "The project grew from a focused Rails application into a broad product platform. The main engineering challenge is keeping many workflows coherent while preserving secure access, responsive performance, and understandable navigation.",
      stack: ["Ruby 3.3", "Rails 7.1", "React 18", "Vite 6", "PostgreSQL", "Tailwind CSS", "Devise", "Action Cable", "Active Storage"],
      metrics: ["40+ database migrations", "35+ API controllers", "30+ React pages and major components", "Realtime and background-job workflows"],
      engineering_highlights: ["Role and workspace authorization", "Complex project and task data flows", "Realtime collaboration", "Calendar recurrence", "Google Sheets and Keka integrations", "PDF editing and export"],
      repository_url: "https://github.com/Divyarajsinhsolanki/rails_vite",
      live_url: "",
      position: 1,
      featured: true,
      published: true
    )
    attach_seed_image(project.cover_image, SCREENSHOT_FILENAMES.first)

    FEATURES.each_with_index do |(category, title, summary, demo_path), index|
      feature = project.portfolio_features.find_or_initialize_by(title: title)
      feature.update!(
        category: category,
        summary: summary,
        demo_path: demo_path,
        alt_text: "#{title} in Nexus Hub",
        position: index + 1,
        published: true
      )
      attach_seed_image(feature.screenshot, SCREENSHOT_FILENAMES.fetch(index))
    end

    profile
  end

  private

  def attach_seed_image(attachment, filename)
    return if attachment.attached?

    path = Rails.root.join("app/assets/images/portfolio", filename)
    return unless path.exist?

    attachment.attach(
      io: path.open("rb"),
      filename: filename,
      content_type: "image/webp"
    )
  end
end
