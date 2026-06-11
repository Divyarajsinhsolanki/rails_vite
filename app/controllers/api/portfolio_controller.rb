class Api::PortfolioController < ApplicationController
  include Rails.application.routes.url_helpers

  def show
    profile = PortfolioProfile.published.includes(avatar_attachment: :blob, resume_attachment: :blob).first
    projects = PortfolioProject.published.ordered.includes(
      { cover_image_attachment: :blob },
      portfolio_features: { screenshot_attachment: :blob }
    )

    render json: {
      profile: profile && serialize_profile(profile),
      projects: projects.map { |project| serialize_project(project) }
    }
  end

  private

  def serialize_profile(profile)
    profile.as_json(
      only: %i[full_name headline location summary skills metrics social_links architecture engineering_highlights]
    ).merge(
      avatar_url: attachment_url(profile.avatar),
      resume_url: attachment_url(profile.resume, disposition: "attachment")
    )
  end

  def serialize_project(project)
    published_features = project.portfolio_features
      .select(&:published?)
      .sort_by { |feature| [feature.position, feature.id] }

    project.as_json(
      only: %i[id title slug tagline summary description stack metrics engineering_highlights repository_url live_url featured]
    ).merge(
      cover_image_url: attachment_url(project.cover_image),
      features: published_features.map { |feature| serialize_feature(feature) }
    )
  end

  def serialize_feature(feature)
    feature.as_json(
      only: %i[id category title summary demo_path alt_text position]
    ).merge(screenshot_url: attachment_url(feature.screenshot))
  end

  def attachment_url(attachment, disposition: "inline")
    return unless attachment.attached?

    rails_blob_url(attachment, only_path: true, disposition: disposition)
  end
end
