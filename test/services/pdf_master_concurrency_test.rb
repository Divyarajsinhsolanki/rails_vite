require "test_helper"

class PdfMasterConcurrencyTest < ActiveSupport::TestCase
  test "page operations do not share mutable gem state" do
    sources = 2.times.map { create_test_pdf(pages: 2) }
    outputs = 2.times.map { Tempfile.new(["pdf-output-", ".pdf"]) }
    errors = Queue.new

    threads = sources.each_with_index.map do |source, index|
      Thread.new do
        FileUtils.cp(source.path, outputs[index].path)
        index.zero? ? PdfMaster::Modify.rotate_page(outputs[index].path, 90, 1) :
                      PdfMaster::Modify.add_blank_page_like(outputs[index].path, 2)
      rescue StandardError => e
        errors << e
      end
    end
    threads.each(&:join)

    failure = errors.pop(true) unless errors.empty?
    assert_nil failure, failure&.message
    assert_equal 2, HexaPDF::Document.open(outputs[0].path).pages.count
    assert_equal 3, HexaPDF::Document.open(outputs[1].path).pages.count
  ensure
    Array(sources).each(&:close!)
    Array(outputs).each(&:close!)
  end

  test "service page operations write to explicit output paths" do
    source = create_test_pdf(pages: 3)
    rotated = Tempfile.new(["pdf-rotated-", ".pdf"])
    deleted = Tempfile.new(["pdf-deleted-", ".pdf"])
    reordered = Tempfile.new(["pdf-reordered-", ".pdf"])
    blank = Tempfile.new(["pdf-blank-", ".pdf"])

    PdfMaster::Modify.rotate_pages(source.path, [1], 90, rotated.path)
    assert_equal 90, HexaPDF::Document.open(rotated.path).pages[0][:Rotate]

    PdfMaster::Modify.delete_pages(source.path, [2], deleted.path)
    assert_equal 2, HexaPDF::Document.open(deleted.path).pages.count

    PdfMaster::Modify.reorder_pages(source.path, [3, 1, 2], reordered.path)
    assert_equal 3, HexaPDF::Document.open(reordered.path).pages.count

    PdfMaster::Modify.add_blank_page_like(source.path, 2, 1, blank.path)
    assert_equal 4, HexaPDF::Document.open(blank.path).pages.count
  ensure
    source&.close!
    [rotated, deleted, reordered, blank].compact.each(&:close!)
  end
end
