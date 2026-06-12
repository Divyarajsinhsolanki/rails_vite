class PortfolioAccess
  def self.enabled?
    ActiveModel::Type::Boolean.new.cast(ENV.fetch("PORTFOLIO_ENABLED", "false"))
  end
end
