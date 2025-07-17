class Api::TwilioController < ApplicationController
  skip_before_action :verify_authenticity_token

  def send_sms
    client = Twilio::REST::Client.new(ENV['TWILIO_ACCOUNT_SID'], ENV['TWILIO_AUTH_TOKEN'])
    message = client.messages.create(
      from: ENV['TWILIO_FROM'],
      to: params[:to],
      body: params[:body] || 'Hey! Your drop is ready.'
    )
    render json: { status: 'sent', sid: message.sid }
  rescue StandardError => e
    render json: { error: e.message }, status: :unprocessable_entity
  end
end
