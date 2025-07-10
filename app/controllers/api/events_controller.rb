require "stripe"

class Api::EventsController < ApplicationController
  skip_before_action :verify_authenticity_token

  def book
    Stripe.api_key = ''
    session = Stripe::Checkout::Session.create(
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: "Event Ticket" },
            unit_amount: 2000,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: "#{root_url}ticket?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "#{root_url}event"
    )
    render json: { url: session.url }
  end
end
