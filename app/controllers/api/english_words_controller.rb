class Api::EnglishWordsController < Api::BaseController
  skip_before_action :authenticate_user!, only: [:show]
  require 'faraday'
  require 'json'

  def show
    response = Faraday.get('https://random-word-api.herokuapp.com/word?number=1')
    data = JSON.parse(response.body)
    word = data.is_a?(Array) ? data.first : data
    render json: { word: word }
  rescue StandardError => e
    Rails.logger.error "EnglishWords error: #{e.message}"
    render json: { error: 'Failed to fetch word' }, status: 500
  end
end
