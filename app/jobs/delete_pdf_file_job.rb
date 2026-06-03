require 'pathname'
require 'fileutils'

class DeletePdfFileJob < ApplicationJob
  queue_as :default

  def perform(file_path, minimum_age_seconds: 24.hours.to_i)
    path = Pathname.new(file_path.to_s).cleanpath
    root = Rails.root.join('storage', 'pdf_master').cleanpath
    return unless path.to_s == root.to_s || path.to_s.start_with?("#{root}/")
    return unless File.exist?(path)
    return if File.mtime(path) > minimum_age_seconds.seconds.ago

    FileUtils.rm_f(path)
  end
end
