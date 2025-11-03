class Api::OpenSourceIssuesController < Api::BaseController
  skip_before_action :authenticate_user!, only: [:show]

  ISSUES = [
    {
      repository: 'vercel/next.js',
      title: 'Improve error overlay formatting for server actions',
      url: 'https://github.com/vercel/next.js/issues/56307',
      summary: 'The development error overlay truncates stack traces for server actions. Help polish the DX by improving the renderer.'
    },
    {
      repository: 'facebook/react',
      title: 'Docs: Clarify rules of hooks for custom hooks',
      url: 'https://github.com/facebook/react/issues/28319',
      summary: 'Review the Rules of Hooks documentation and contribute clarifying guidance or examples for library authors.'
    },
    {
      repository: 'rails/rails',
      title: 'Active Job enqueue logging should include job arguments',
      url: 'https://github.com/rails/rails/issues/50761',
      summary: 'Improve observability by ensuring job arguments are included when Active Job logs enqueue operations.'
    },
    {
      repository: 'tailwindlabs/tailwindcss',
      title: 'Add configuration docs for container queries plugin',
      url: 'https://github.com/tailwindlabs/tailwindcss/issues/12969',
      summary: 'Write documentation covering setup and examples for the new container queries plugin released in Tailwind CSS v3.4.'
    },
    {
      repository: 'pnpm/pnpm',
      title: 'Feature request: workspace-level npm scripts summary command',
      url: 'https://github.com/pnpm/pnpm/issues/7439',
      summary: 'Contribute a CLI enhancement that lists package.json scripts available across a workspace to ease discovery.'
    },
  ].freeze

  def show
    issue = ISSUES.sample
    Rails.logger.info("OpenSourceIssues success: #{issue[:repository]} -> #{issue[:title]}")
    render json: issue.merge(fetched_at: Time.current.iso8601)
  rescue StandardError => e
    Rails.logger.error("OpenSourceIssues error: #{e.message}")
    render json: { error: 'Failed to load open source issue' }, status: :internal_server_error
  end
end
