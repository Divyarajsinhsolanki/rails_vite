namespace :mcp do
  desc "Create an MCP access token. Usage: bin/rails mcp:token EMAIL=user@example.com NAME=chatgpt SCOPES=app:read,app:write,repo:read"
  task token: :environment do
    email = ENV.fetch("EMAIL", nil)
    abort "EMAIL is required" if email.blank?

    user = User.find_by!(email: email)
    name = ENV.fetch("NAME", "ChatGPT")
    scopes = ENV.fetch("SCOPES", McpAccessToken::DEFAULT_SCOPES.join(",")).split(",").map(&:strip).reject(&:blank?)
    days = ENV.fetch("EXPIRES_IN_DAYS", "180").to_i

    record, raw_token = McpAccessToken.issue!(
      user: user,
      name: name,
      scopes: scopes,
      expires_at: days.positive? ? days.days.from_now : nil
    )

    puts "Created MCP token ##{record.id} for #{user.email}"
    puts "Scopes: #{record.scopes.join(', ')}"
    puts "Expires at: #{record.expires_at || 'never'}"
    puts
    puts raw_token
    puts
    puts "Store this token now. Only its SHA-256 digest is saved."
  end

  desc "Revoke an MCP access token. Usage: bin/rails mcp:revoke ID=123"
  task revoke: :environment do
    id = ENV.fetch("ID", nil)
    abort "ID is required" if id.blank?

    token = McpAccessToken.find(id)
    token.revoke!
    puts "Revoked MCP token ##{token.id} (#{token.name})"
  end
end
