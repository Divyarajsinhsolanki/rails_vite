class Api::EnglishWordsController < Api::BaseController
  skip_before_action :authenticate_user!, only: [:show]
  require 'faraday'
  require 'json'

  FALLBACK_WORDS = %w[
    serendipity tenacity eloquence catalyst luminary cadence alchemy
    nebula renaissance epiphany synergy zephyr diligence apex
  ].freeze

  def show
    word = fetch_remote_word
    used_fallback = false

    if word.blank?
      word = FALLBACK_WORDS.sample
      used_fallback = true
    end

    Rails.logger.info("EnglishWords success#{' (fallback)' if used_fallback}: #{word}")
    render json: { word: word }
  rescue StandardError => e
    fallback_word = FALLBACK_WORDS.sample
    Rails.logger.error("EnglishWords error, serving fallback: #{e.message}")
    render json: { word: fallback_word }, status: :ok
  end

  private

  def fetch_remote_word
    response = Faraday.get('https://random-word-api.herokuapp.com/word?number=1')
    return unless response.success?

    data = JSON.parse(response.body)
    data.is_a?(Array) ? data.first : data
  rescue StandardError => e
    Rails.logger.error("EnglishWords fetch error: #{e.message}")
    nil
  end
end
