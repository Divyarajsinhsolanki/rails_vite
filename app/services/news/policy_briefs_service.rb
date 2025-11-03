require "action_view"
require "net/http"
require "rss"

module News
  class PolicyBriefsService
    CACHE_EXPIRY = 1.hour
    MAX_ITEMS = 6

    TOPIC_FEEDS = {
      "global" => [
        "https://feeds.brookings.edu/brookingsrss/topics/global-development",
        "https://www.whitehouse.gov/briefing-room/feed/"
      ],
      "economy" => [
        "https://feeds.brookings.edu/brookingsrss/topics/us-economy",
        "https://www.oecd.org/newsroom/policybriefs/rss"
      ],
      "technology" => [
        "https://feeds.brookings.edu/brookingsrss/topics/technology-and-innovation",
        "https://www.whitehouse.gov/ostp/feed/"
      ],
      "health" => [
        "https://feeds.brookings.edu/brookingsrss/topics/global-health",
        "https://www.who.int/feeds/entity/mediacentre/news/en/rss.xml"
      ],
    }.freeze

    FALLBACK_FEEDS = [
      "https://www.whitehouse.gov/briefing-room/feed/",
      "https://feeds.brookings.edu/brookingsrss/topics/government-and-regulation"
    ].freeze

    class << self
      def fetch(topic: "global")
        normalized_topic = normalize_topic(topic)
        Rails.cache.fetch(cache_key(normalized_topic), expires_in: CACHE_EXPIRY) do
          feed_urls_for(normalized_topic).each do |url|
            briefs = load_feed(url)
            return build_payload(normalized_topic, briefs) if briefs.any?
          end

          build_payload(normalized_topic, [])
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
        Rails.logger.warn("[PolicyBriefsService] Failed to load #{url}: #{e.class} - #{e.message}")
        []
      end

      def sanitize(text)
        return "" if text.blank?

        ActionView::Base.full_sanitizer.sanitize(text).squish.truncate(240)
      end

      def feed_urls_for(topic)
        TOPIC_FEEDS.fetch(topic, []) + FALLBACK_FEEDS
      end

      def normalize_topic(topic)
        value = topic.to_s.downcase
        return value if TOPIC_FEEDS.key?(value)

        "global"
      end

      def build_payload(topic, briefs)
        {
          topic: topic,
          briefs: briefs,
          fetched_at: Time.current.iso8601,
        }
      end

      def cache_key(topic)
        "news/policy_briefs/#{topic}"
      end
    end
  end
end
