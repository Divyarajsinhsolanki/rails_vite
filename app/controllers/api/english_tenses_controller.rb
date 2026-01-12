class Api::EnglishTensesController < Api::BaseController
  skip_before_action :authenticate_user!, only: [:show]
  require 'faraday'
  require 'json'

  API_URLS = [
    'https://gist.githubusercontent.com/linguistics/87389a915632/raw/tenses.json',
    'https://raw.githubusercontent.com/ghosh/english-tense-examples/master/tenses.json'
  ]
  FALLBACK_TENSES = [
    { "tense" => "Simple Present", "example" => "She writes code every day." },
    { "tense" => "Present Continuous", "example" => "I am refactoring the module right now." },
    { "tense" => "Simple Past", "example" => "They deployed the app yesterday." },
    { "tense" => "Past Continuous", "example" => "We were reviewing pull requests all evening." },
    { "tense" => "Present Perfect", "example" => "He has fixed the failing specs." },
    { "tense" => "Future Simple", "example" => "I will add tests for this service." },
    { "tense" => "Future Continuous", "example" => "She will be pairing on the feature tomorrow." },
    { "tense" => "Present Perfect Continuous", "example" => "They have been debugging the API for hours." }
  ].freeze

  def show
    items = nil
    used_fallback = false

    API_URLS.each do |url|
      items = fetch_items(url)
      break if items
    end

    if items.blank?
      used_fallback = true
      items = FALLBACK_TENSES
    end

    if items
      Rails.logger.info("EnglishTenses success#{' (fallback)' if used_fallback}")
      render json: items.sample
    else
      Rails.logger.error('EnglishTenses error: failed to fetch')
      render json: { error: 'Failed to fetch tense' }, status: :internal_server_error
    end
  end

  private

  def fetch_items(url)
    response = Faraday.get(url)
    return unless response.success?
    Rails.logger.info("EnglishTenses fetched from #{url}")
    JSON.parse(response.body)
  rescue StandardError => e
    Rails.logger.error "EnglishTenses error: #{e.message}"
    nil
  end
end
