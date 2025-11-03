require "action_view"
require "net/http"
require "rss"

module News
  class LocalHeadlinesService
    CACHE_EXPIRY = 30.minutes
    MAX_ITEMS = 6

    REGION_FEEDS = {
      "us" => ["https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en"],
      "in" => ["https://news.google.com/rss?hl=en-IN&gl=IN&ceid=IN:en"],
      "gb" => ["https://news.google.com/rss?hl=en-GB&gl=GB&ceid=GB:en"],
      "au" => ["https://news.google.com/rss?hl=en-AU&gl=AU&ceid=AU:en"],
      "ca" => ["https://news.google.com/rss?hl=en-CA&gl=CA&ceid=CA:en"],
    }.freeze

    FALLBACK_FEEDS = [
      "https://rss.nytimes.com/services/xml/rss/nyt/World.xml",
      "https://feeds.bbci.co.uk/news/world/rss.xml",
    ].freeze

    class << self
      def fetch(region: "us")
        normalized_region = normalize_region(region)
        Rails.cache.fetch(cache_key(normalized_region), expires_in: CACHE_EXPIRY) do
          feed_urls_for(normalized_region).each do |url|
            articles = load_feed(url)
            return build_payload(normalized_region, articles) if articles.any?
          end

          build_payload(normalized_region, [])
        end
      end

      private

      def load_feed(url)
        uri = URI.parse(url)
        response = Net::HTTP.get_response(uri)
        return [] unless response.is_a?(Net::HTTPSuccess)

        rss = RSS::Parser.parse(response.body, false)
        return [] unless rss&.items&.any?

        rss.items.first(MAX_ITEMS).map do |item|
          {
            title: item.title&.strip,
            url: item.link,
            summary: sanitize(item.description || item&.content&.content),
            source: rss.channel&.title || uri.host,
            published_at: item.pubDate&.iso8601,
          }
        end
      rescue StandardError => e
        Rails.logger.warn("[LocalHeadlinesService] Failed to load #{url}: #{e.class} - #{e.message}")
        []
      end

      def sanitize(text)
        return "" if text.blank?

        ActionView::Base.full_sanitizer.sanitize(text).squish.truncate(220)
      end

      def feed_urls_for(region)
        REGION_FEEDS.fetch(region, []) + FALLBACK_FEEDS
      end

      def normalize_region(region)
        value = region.to_s.downcase
        return value if REGION_FEEDS.key?(value)

        from_split = value.split(/[-_]/).last
        return from_split if REGION_FEEDS.key?(from_split)

        value_prefix = value[0, 2]
        REGION_FEEDS.key?(value_prefix) ? value_prefix : "us"
      end

      def build_payload(region, articles)
        {
          region: region,
          articles: articles,
          fetched_at: Time.current.iso8601,
        }
      end

      def cache_key(region)
        "news/local_headlines/#{region}"
      end
    end
  end
end
