class Api::JokesController < Api::BaseController
  skip_before_action :authenticate_user!, only: [:show]

  JOKES = [
    "Why do programmers prefer dark mode? Because light attracts bugs!",
    "I would tell you a UDP joke, but you might not get it.",
    "What's a programmer's favorite hangout place? Foo Bar.",
    "Why did the developer go broke? Because they used up all their cache.",
    "How many programmers does it take to change a light bulb? None, that's a hardware problem!"
  ].freeze

  def show
    render json: { joke: JOKES.sample }
  end
end
