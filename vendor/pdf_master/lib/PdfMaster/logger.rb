# frozen_string_literal: true

require 'logger'

module PdfMaster
  class Logger
    def self.instance
      return Rails.logger if defined?(Rails) && Rails.respond_to?(:logger)

      @logger ||= ::Logger.new($stdout)
    end

    def self.log(message, level = :info)
      instance.public_send(level, "[PdfMaster] #{message}")
    end

    def self.log_exception(operation, error)
      log("#{operation} failed (#{error.class})", :error)
    end

    def self.log_and_raise(error_class, message)
      log(message, :error)
      raise error_class, message
    end
  end
end
