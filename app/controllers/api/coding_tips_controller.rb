# # app/controllers/api/coding_tips_controller.rb
# class Api::CodingTipsController < ApplicationController
#   require 'openai'

#   def show
#     client = OpenAI::Client.new(access_token: '')

#     response = client.chat(
#       parameters: {
#         model: "gpt-4o",
#         messages: [
#           { role: "system", content: "You are a helpful assistant providing concise coding tips for developers." },
#           { role: "user", content: "Give me a random coding tip for software developers." }
#         ],
#         max_tokens: 60,
#         temperature: 0.7
#       }
#     )

#     Rails.logger.info "OpenAI response: #{response.inspect}"

#     tip = response.dig("choices", 0, "message", "content")
#     tip = "Keep your code clean and well-documented." if tip.blank?

#     render json: { tip: tip.strip }
#   rescue => e
#     Rails.logger.error "OpenAI Error: #{e.message}"
#     render json: { error: "Failed to fetch coding tip" }, status: 500
#   end
# end
require 'faraday'
require 'json'

class Api::CodingTipsController < Api::BaseController
  skip_before_action :authenticate_user!, only: [:show]

  TIPS = [
    "Break down big problems into smaller tasks before you start coding.",
    "Write tests for critical logic to catch regressions early.",
    "Keep functions short and focused on a single responsibility.",
    "Use version control for every project, even small experiments.",
    "Read error messages carefully—they often tell you exactly what's wrong.",
  ].freeze

  def show
    tip = TIPS.sample
    Rails.logger.info("CodingTips success: #{tip}")
    render json: { tip: tip }
  rescue StandardError => e
    Rails.logger.error("CodingTips error: #{e.message}")
    render json: { error: 'Failed to fetch coding tip' }, status: :internal_server_error
  end
end
