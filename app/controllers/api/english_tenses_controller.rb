class Api::EnglishTensesController < Api::BaseController
  skip_before_action :authenticate_user!, only: [:show]
  require 'faraday'
  require 'json'

  API_URLS = [
    'https://gist.githubusercontent.com/linguistics/87389a915632/raw/tenses.json',
    'https://raw.githubusercontent.com/ghosh/english-tense-examples/master/tenses.json'
  ]

  def show
    items = nil

    API_URLS.each do |url|
      items = fetch_items(url)
      break if items
    end

    if items
      render json: items.sample
    else
      render json: { error: 'Failed to fetch tense' }, status: 500
    end
  end

  private

  def fetch_items(url)
    response = Faraday.get(url)
    return unless response.success?
    JSON.parse(response.body)
  rescue StandardError => e
    Rails.logger.error "EnglishTenses error: #{e.message}"
    nil
  end
end
