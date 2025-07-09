class Api::EnglishTensesController < Api::BaseController
  skip_before_action :authenticate_user!, only: [:show]
  require 'faraday'
  require 'json'

  API_URL = 'https://gist.githubusercontent.com/linguistics/87389a915632/raw/tenses.json'

  def show
    response = Faraday.get(API_URL)
    items = JSON.parse(response.body)
    tense = items.sample
    render json: tense
  rescue StandardError => e
    Rails.logger.error "EnglishTenses error: #{e.message}"
    render json: { error: 'Failed to fetch tense' }, status: 500
  end
end
