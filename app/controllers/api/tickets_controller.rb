require "rqrcode"
require "base64"

class Api::TicketsController < ApplicationController
  skip_before_action :verify_authenticity_token

  def show
    session_id = params[:session_id]
    qr = RQRCode::QRCode.new(session_id || "dummy")
    png = qr.as_png(size: 300)
    render json: { qr_data: Base64.strict_encode64(png.to_s) }
  end

  def download
    session_id = params[:session_id]
    qr = RQRCode::QRCode.new(session_id)
    png = qr.as_png(size: 300)
    send_data png.to_s, type: "image/png", filename: "ticket.png"
  end
end
