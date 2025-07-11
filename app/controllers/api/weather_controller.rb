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
    response = Faraday.get("https://wttr.in/#{encoded_location}?format=j1&num_of_days=7")
    data = JSON.parse(response.body)

    current = data['current_condition']&.first || {}

    current_weather = {
      temp_c: current['temp_C'],
      temp_f: current['temp_F'],
      description: current.dig('weatherDesc', 0, 'value'),
      icon_url: current.dig('weatherIconUrl', 0, 'value')
    }

    forecast = Array(data['weather']).map do |day|
      {
        date: day['date'],
        max_temp_c: day['maxtempC'],
        min_temp_c: day['mintempC'],
        icon_url: day.dig('hourly', 0, 'weatherIconUrl', 0, 'value'),
        description: day.dig('hourly', 0, 'weatherDesc', 0, 'value')
      }
    end

    render json: { location: location, current: current_weather, forecast: forecast }
  rescue StandardError => e
    Rails.logger.error "Weather error: #{e.message}"
    render json: { error: 'Failed to fetch weather data' }, status: 500
  end
end
