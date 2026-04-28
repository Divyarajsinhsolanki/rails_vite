class Current < ActiveSupport::CurrentAttributes
  attribute :user, :request_id

  class << self
    def request_id
      instance.request_id
    end

    def request_id=(value)
      instance.request_id = value
    end
  end

  def request_id
    attributes[:request_id]
  end

  def request_id=(value)
    attributes[:request_id] = value
  end
end
