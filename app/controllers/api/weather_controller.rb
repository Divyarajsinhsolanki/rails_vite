class Api::WeatherController < Api::BaseController
  skip_before_action :authenticate_user!, only: [:show]
  require 'faraday'
  require 'json'
  require 'uri'

  def show
    location = if params[:lat].present? && params[:lon].present?
                 "#{params[:lat]},#{params[:lon]}"
               else
                 params[:city].presence || 'London'
               end

    encoded_location = URI.encode_www_form_component(location)
    response = Faraday.get("https://wttr.in/#{encoded_location}?format=j1")
    data = JSON.parse(response.body)
    current = data['current_condition']&.first || {}

    weather = {
      location: location,
      temp_c: current['temp_C'],
      temp_f: current['temp_F'],
      description: current.dig('weatherDesc', 0, 'value'),
      icon_url: current.dig('weatherIconUrl', 0, 'value')
    }

    render json: weather
  rescue StandardError => e
    Rails.logger.error "Weather error: #{e.message}"
    render json: { error: 'Failed to fetch weather data' }, status: 500
  end
end
