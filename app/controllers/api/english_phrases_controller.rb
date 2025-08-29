class Api::EnglishPhrasesController < Api::BaseController
  skip_before_action :authenticate_user!, only: [:show]
  require 'faraday'
  require 'json'

  PRIMARY_URL = 'https://api.quotable.io/random'
  FALLBACK_URL = 'https://zenquotes.io/api/random'

  def show
    data = fetch_phrase(PRIMARY_URL) || fetch_phrase(FALLBACK_URL)

    if data
      Rails.logger.info('EnglishPhrases success')
      render json: data
    else
      Rails.logger.error('EnglishPhrases error: failed to fetch')
      render json: { error: 'Failed to fetch phrase' }, status: :internal_server_error
    end
  end

  private

  def fetch_phrase(url)
    response = Faraday.get(url)
    return unless response.success?
    Rails.logger.info("EnglishPhrases fetched from #{url}")
    body = JSON.parse(response.body)
    if url == FALLBACK_URL
      body = body.first if body.is_a?(Array)
      { phrase: body['q'], author: body['a'] }
    else
      { phrase: body['content'], author: body['author'] }
    end
  rescue StandardError => e
    Rails.logger.error "EnglishPhrases error: #{e.message}"
    nil
  end
end
