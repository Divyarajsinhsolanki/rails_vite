class Api::DevToolsController < Api::BaseController
  skip_before_action :authenticate_user!, only: [:show]

  TOOLS = [
    {
      name: 'HTTPie',
      description: 'A friendly command-line HTTP client that makes testing and debugging APIs delightful.',
      url: 'https://httpie.io/'
    },
    {
      name: 'ngrok',
      description: 'Instantly expose your localhost to securely share demos and receive webhooks.',
      url: 'https://ngrok.com/'
    },
    {
      name: 'Tuple',
      description: 'Low-latency remote pair programming designed specifically for developers.',
      url: 'https://tuple.app/'
    },
    {
      name: 'Warp',
      description: 'A modern Rust-based terminal with AI features, collaboration, and command workflows.',
      url: 'https://www.warp.dev/'
    },
    {
      name: 'Raycast',
      description: 'A fast launcher for macOS that automates developer workflows with powerful extensions.',
      url: 'https://www.raycast.com/'
    },
  ].freeze

  def show
    tool = TOOLS.sample
    Rails.logger.info("DevTools success: #{tool[:name]}")
    render json: tool.merge(fetched_at: Time.current.iso8601)
  rescue StandardError => e
    Rails.logger.error("DevTools error: #{e.message}")
    render json: { error: 'Failed to load developer tool' }, status: :internal_server_error
  end
end
