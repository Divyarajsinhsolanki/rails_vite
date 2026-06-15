# frozen_string_literal: true

require 'hexapdf'
require 'combine_pdf'
require 'prawn'
require 'mini_magick'
require 'shellwords'
require 'pdfkit'

require_relative 'PdfMaster/version'
require_relative 'PdfMaster/errors'
require_relative 'PdfMaster/validator'
require_relative 'PdfMaster/logger'
require_relative 'PdfMaster/base'

require_relative 'PdfMaster/modify'
require_relative 'PdfMaster/editor'
require_relative 'PdfMaster/converter'

module PdfMaster
  # Custom errors live under PdfMaster::Errors
  include PdfMaster::Errors

  def self.method_missing(method_name, *args, &block)
    Logger.log("Calling: #{method_name} with arguments: #{args.inspect}")

    Validator.validate_pdf(args.first) if args.any?

    # Delegate the call to appropriate class
    [Modify, Editor, Converter].each do |klass|
      if klass.respond_to?(method_name)
        return klass.public_send(method_name, *args, &block)
      end
    end

    super
  end

  def self.respond_to_missing?(method_name, include_private = false)
    [Modify, Editor, Converter].any? { |klass| klass.respond_to?(method_name) } || super
  end
end
