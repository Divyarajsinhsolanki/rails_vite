class Api::NewsController < Api::BaseController
  def local_headlines
    region = params[:region].presence || inferred_region
    data = News::LocalHeadlinesService.fetch(region: region)
    render json: data
  rescue StandardError => e
    Rails.logger.error("[NewsController#local_headlines] #{e.class}: #{e.message}")
    render json: { region: region, articles: [], error: "Unable to load local headlines" }, status: :service_unavailable
  end

  def policy_briefs
    topic = params[:topic].presence || "global"
    data = News::PolicyBriefsService.fetch(topic: topic)
    render json: data
  rescue StandardError => e
    Rails.logger.error("[NewsController#policy_briefs] #{e.class}: #{e.message}")
    render json: { topic: topic, briefs: [], error: "Unable to load policy briefs" }, status: :service_unavailable
  end

  private

  def inferred_region
    header = request.headers['HTTP_ACCEPT_LANGUAGE']
    return 'us' if header.blank?

    header.split(',').each do |part|
      locale = part.split(';').first.to_s.strip
      next if locale.blank?

      region = locale.split('-')[1]
      return region.downcase if region.present?
    end

    'us'
  end
end
