require "test_helper"

class PdfCoordinateMapperTest < ActiveSupport::TestCase
  test "maps viewer coordinates for rotated pages" do
    clockwise = PdfDocuments::CoordinateMapper.new(width: 600, height: 800, rotation: 90)
    counter_clockwise = PdfDocuments::CoordinateMapper.new(width: 600, height: 800, rotation: 270)

    assert_equal [20.0, 10.0], clockwise.point(10, 20)
    assert_equal [580.0, 790.0], counter_clockwise.point(10, 20)
  end

  test "maps a viewer rectangle into a normalized PDF rectangle" do
    mapper = PdfDocuments::CoordinateMapper.new(width: 600, height: 800, rotation: 90)

    assert_equal(
      { x: 20.0, y: 110.0, width: 40.0, height: 100.0, bottom: 10.0 },
      mapper.rectangle(x: 10, y: 20, width: 100, height: 40)
    )
  end
end
