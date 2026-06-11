
lib = File.expand_path("../lib", __FILE__)
$LOAD_PATH.unshift(lib) unless $LOAD_PATH.include?(lib)
require "PdfMaster/version"

Gem::Specification.new do |spec|
  spec.name          = "PdfMaster"
  spec.version       = PdfMaster::VERSION
  spec.authors       = ["Atharva System"]
  spec.email         = ["contact@atharvasystem.com"]

  spec.summary       = "A powerful Ruby gem for handling PDF operations."
  spec.description   = "PdfMaster provides various PDF manipulation features, including creation, merging, and text extraction."
  spec.homepage      = "https://github.com/Atharva-System/pdfmaster"

  # Prevent pushing this gem to RubyGems.org. To allow pushes either set the 'allowed_push_host'
  # to allow pushing to a single host or delete this section to allow pushing to any host.
  if spec.respond_to?(:metadata)
    spec.metadata["allowed_push_host"] = "http://mygemserver.com"

    spec.metadata["homepage_uri"] = spec.homepage
    spec.metadata["source_code_uri"] = "https://github.com/Atharva-System/pdfmaster"
    spec.metadata["changelog_uri"] = "https://github.com/Atharva-System/pdfmaster/releases"
  else
    raise "RubyGems 2.0 or newer is required to protect against " \
      "public gem pushes."
  end

  # Specify which files should be added to the gem when it is released.
  # The `git ls-files -z` loads the files in the RubyGem that have been added into git.
  spec.files = Dir.glob("{bin,lib}/**/*", File::FNM_DOTMATCH).reject do |f|
    f.match(%r{^(test|spec|features|.git|.github|appveyor|Gemfile|PdfMaster-.*\.gem)}) ||
    File.directory?(f)
  end

  spec.bindir        = "bin"
  spec.executables   = spec.files.grep(%r{^bin/}) { |f| File.basename(f) }
  spec.require_paths = ["lib"]

  spec.required_ruby_version = ">= 3.3.0"

  spec.add_dependency "combine_pdf", '1.0.25'
  spec.add_dependency "prawn", "~> 2.4"
  spec.add_dependency "hexapdf", "~> 0.16"
  spec.add_dependency "mini_magick", "~> 4.11"
  spec.add_dependency "shellwords"
  spec.add_dependency "pdfkit", "~> 0.8"
  spec.add_dependency "wkhtmltopdf-binary", "~> 0.12.6"
  
  spec.add_development_dependency 'rspec', "~> 3.13.0"
end
