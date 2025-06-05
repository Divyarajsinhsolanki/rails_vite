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

class Api::CodingTipsController < ApplicationController
  def show
    token = ''
    # model_id = 'gpt2' # Lightweight free model for demonstration; you can pick any HF model supporting text generation
    model_id = "black-forest-labs/FLUX.1-dev"  # try this as an example

    conn = Faraday.new(url: "https://api-inference.huggingface.co") do |faraday|
      faraday.headers['Authorization'] = "Bearer #{token}"
      faraday.adapter Faraday.default_adapter
    end
    puts model_id
    puts token
    puts conn
    prompt = "Give me a concise and practical coding tip for software developers."

    response = conn.post("/models/#{model_id}") do |req|
      req.body = { inputs: prompt, parameters: { max_new_tokens: 60, temperature: 0.7 } }.to_json
      req.headers['Content-Type'] = 'application/json'
    end
    puts response
    if response.success?
      result = JSON.parse(response.body)
      # Hugging Face text generation returns an array of { generated_text: "..." }
      tip = result.is_a?(Array) && result.first['generated_text'] ? result.first['generated_text'].strip : nil
      tip = "Keep your code clean and well-documented." if tip.blank?

      render json: { tip: tip }
    else
      Rails.logger.error "Hugging Face API Error: #{response.status} - #{response.body}"
      render json: { error: "Failed to fetch coding tip" }, status: :internal_server_error
    end
  rescue => e
    Rails.logger.error "Exception: #{e.message}"
    render json: { error: "Internal server error" }, status: :internal_server_error
  end
end
