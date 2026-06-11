class Api::DemoController < Api::BaseController
  GROUPS = [
    {
      key: "delivery",
      title: "Project Delivery",
      summary: "Projects, sprints, Kanban planning, statistics, issues, sheets, and project vaults.",
      route: "/projects"
    },
    {
      key: "focus",
      title: "Planning and Focus",
      summary: "Calendar planning, daily momentum, work logs, priorities, notes, and Pomodoro sessions.",
      route: "/momentum"
    },
    {
      key: "collaboration",
      title: "Team Collaboration",
      summary: "Posts, teams, skills, departments, real-time chat, mentions, and notifications.",
      route: "/posts"
    },
    {
      key: "knowledge",
      title: "Knowledge and Learning",
      summary: "Knowledge cards, bookmarks, learning goals, external signals, and 3D exploration.",
      route: "/knowledge"
    },
    {
      key: "documents",
      title: "PDF Workflows",
      summary: "Editing, annotation, signing, watermarking, merging, splitting, protection, and export.",
      route: "/pdf-master"
    },
    {
      key: "platform",
      title: "Platform Engineering",
      summary: "Rails APIs, React UI, authorization, jobs, integrations, performance, and deployment.",
      route: "/demo#architecture"
    }
  ].freeze

  def manifest
    return head :forbidden unless current_user.demo_account?

    project = Project.order(:id).first
    groups = GROUPS.map do |group|
      route = group[:route]
      route = "/projects/#{project.id}/dashboard" if group[:key] == "delivery" && project
      group.merge(route: route)
    end

    render json: {
      workspace: {
        id: current_user.workspace_id,
        name: current_user.workspace.name
      },
      duration: "5 minutes",
      groups: groups
    }
  end
end
