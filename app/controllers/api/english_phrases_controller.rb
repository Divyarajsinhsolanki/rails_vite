class Api::EnglishPhrasesController < Api::BaseController
  skip_before_action :authenticate_user!, only: [:show]
  require 'faraday'
  require 'json'

  def show
    response = Faraday.get('https://api.quotable.io/random')
    data = JSON.parse(response.body)
    render json: { phrase: data['content'], author: data['author'] }
  rescue StandardError => e
    Rails.logger.error "EnglishPhrases error: #{e.message}"
    render json: { error: 'Failed to fetch phrase' }, status: 500
  end
end
