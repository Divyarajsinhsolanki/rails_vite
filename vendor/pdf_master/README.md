# PdfMaster

PdfMaster is a Ruby gem that provides various utilities for manipulating PDFs, including adding text and images, modifying pages, adding annotations, handling form fields, applying watermarks, merging/splitting PDFs, and encrypting files.

## Installation

Add this line to your application's Gemfile:

```ruby
gem 'PdfMaster'
```

And then execute:

```sh
bundle install
```

Or install it manually:

```sh
gem install PdfMaster
```

## Dependencies

This gem relies on the following dependencies:

- combine_pdf - For handling PDF operations such as merging, splitting, and encryption.
- prawn - For adding text, images, and annotations to PDFs.
- hexapdf - For advanced PDF processing and optimizations.

## Usage

Require the library in your Ruby file:

```ruby
require 'PdfMaster'
```

## Parameters Correspondence

All methods in **PdfMaster** follow a common parameter structure. Below is a breakdown of the parameters used across different actions:

| Parameter   | Type            | Description  | Default |
|------------|----------------|-------------|---------|
| pdf_path | String        | Path to the input PDF file. | Required |
| text / field_name / watermark | String | The text, field name, or watermark content to be added. | Required for respective actions |
| image_path | String | Path to the image file (for adding images). | Required for add_image |
| x | Integer, nil | X-coordinate position on the page. Pass nil to use position. | nil |
| y | Integer, nil | Y-coordinate position on the page. Pass nil to use position. | nil |
| page | Integer | Page number where the modification should be applied. | 1 |
| position | Symbol, nil | Predefined position (:top_right, :center, etc.). If set, x and y are ignored. | nil |
| page_number | Integer | The page number for page-based actions like remove_page, rotate_page, and duplicate_page. | Required for respective actions |
| degrees | Integer | Rotation angle (e.g., 90, 180, 270) for rotate_page. | Required for rotate_page |
| input_pdfs | Array<String> | List of PDFs to be merged. | Required for merge_pdfs |
| split_page | Integer | Page number where the PDF should be split. | Required for split_pdf |
| link_text | String | Text for the hyperlink. | Required for add_hyperlink |
| url | String | URL for the hyperlink. | Required for add_hyperlink |
| output_pdf | String | Path to the output PDF file. | Required for extract_pages, rearrange_pages, encrypt_pdf |
| pages | Array<Integer> | List of pages for extraction or rearrangement. | Required for extract_pages, rearrange_pages |
| header_text | String | Header text to be added. | Required for add_header_footer |
| footer_text | String | Footer text to be added. | Required for add_header_footer |
| password | String | Password for encryption. | Required for encrypt_pdf |
| font_settings | Hash, nil | Custom font settings including family, size, style, and color. | nil |
| degree | Integer | Rotation angle for the received stamp. | 0 |
| rotate_direction | String | Direction of rotation ('left' or 'right'). | 'right' |

### Positioning

For methods accepting x and y, you can instead use predefined positions:

- :top_left
- :top_center
- :top_right
- :center
- :bottom_left
- :bottom_center
- :bottom_right

Example usage:

```ruby
PdfMaster::Editor.add_text('input.pdf', 'Hello World', nil, nil, 1, :top_right)
```

This ensures text is positioned automatically at the **top-right** of the page.

### Rearrangement Actions

For page rearrangement actions, you can use the following options:

- **:move_up** - Move the selected pages one position up.
- **:move_down** - Move the selected pages one position down.
- **:move_first** - Move the selected pages to the first position.
- **:move_last** - Move the selected pages to the last position.
- **:swap** - Swap two specified pages.
- **:move_to** - Move a page to a specified position.

Example usage:

```ruby
PdfMaster::Modify.rearrange_pages('input.pdf', :move_up, 3)
```

This moves **page 3** one position up in the document.

## PDF Editing and Manipulation

### Adding Text to a PDF

```ruby
PdfMaster::Editor.add_text('input.pdf', 'Hello World', 100, 100, 1, :top_right, { family: 'Times-Roman', size: 14, style: :italic, color: 'FF0000' })
```

### Adding an Image to a PDF

```ruby
PdfMaster::Editor.add_image('input.pdf', 'image.png', 100, 100, 1, :center)
```

### Adding a Watermark

```ruby
PdfMaster::Editor.add_watermark('input.pdf', 'CONFIDENTIAL', 50, 50, 1, :bottom_right, { family: 'Courier', size: 12, style: :bold, color: '808080' })
```

### Adding an Annotation

```ruby
PdfMaster::Editor.add_annotation('input.pdf', 'Note', 50, 50, 2, :top_left, { family: 'Helvetica', size: 10, color: '0000FF' })
```

### Adding a Hyperlink

```ruby
PdfMaster::Editor.add_hyperlink('input.pdf', 'Click here', 'https://example.com', 50, 50, 1, { family: 'Verdana', size: 10, color: '0000FF' })
```

### Adding a Header and Footer

```ruby
PdfMaster::Editor.add_header_footer('input.pdf', 'Header Text', 'Footer Text', { family: 'Arial', size: 12, color: '000000' })
```

### Adding a Received Stamp

```ruby
PdfMaster::Editor.add_received_stamp('input.pdf', 'Received', nil, nil, 1, :top_left, 45, 'right', { family: 'Times-Roman', size: 14, style: :italic, color: 'FF0000' })
```

## Page Modifications

### Adding a Blank Page

```ruby
PdfMaster::Modify.add_page('input.pdf', 2)
```

### Removing a Page

```ruby
PdfMaster::Modify.remove_page('input.pdf', 1)
```

### Rotating a Page

```ruby
PdfMaster::Modify.rotate_page('input.pdf', 90, 1)
```

### Duplicating a Page

```ruby
PdfMaster::Modify.duplicate_pages('input.pdf', 1)
```

### Rearranging Pages in a PDF

```ruby
PdfMaster::Modify.rearrange_pages('input.pdf', :move_up, 2, 1)
```

### Extracting Specific Pages

```ruby
PdfMaster::Modify.extract_pages('input.pdf', [1, 2], 'output.pdf')
```

### Merging Multiple PDFs

```ruby
PdfMaster::Modify.merge_pdfs('output.pdf', 'file1.pdf', 'file2.pdf')
```

### Splitting a PDF into Parts

```ruby
PdfMaster::Modify.split_pdf('input.pdf', 1)
```

## Encrypting a PDF

```ruby
PdfMaster::Modify.encrypt_pdf('input.pdf', 'output.pdf', 'password123')
```

### Compressing a PDF

```ruby
PdfMaster::Modify.compress_pdf('input.pdf', 'compressed.pdf')
```

### Cropping a Page

```ruby
PdfMaster::Modify.crop_page('input.pdf', 1, 50, 50, 400, 500)
```

### Adding Page Numbers

```ruby
PdfMaster::Modify.add_page_numbers('input.pdf')
```

### Updating PDF Metadata

```ruby
PdfMaster::Modify.update_metadata('input.pdf', title: 'My Title', author: 'Me')
```

### Removing Metadata

```ruby
PdfMaster::Modify.remove_metadata('input.pdf')
```

### Flattening Form Fields

```ruby
PdfMaster::Modify.flatten_form_fields('input.pdf')
```

### Changing Page Orientation

```ruby
PdfMaster::Modify.change_orientation('input.pdf', :landscape)
```

## Running Tests

To run the test suite, execute:

```sh
bundle exec rspec
```

This will create a git tag for the version, push git commits and tags, and push the .gem file to [rubygems.org](https://rubygems.org).

## Contributing

Bug reports and pull requests are welcome on GitHub at [pdf-master repository](https://github.com/Atharva-System/PdfMaster). This project is intended to be a safe, welcoming space for collaboration, and contributors are expected to adhere to the [Contributor Covenant](http://contributor-covenant.org) code of conduct.

## License

The gem is available as open source under the terms of the [MIT License](https://opensource.org/licenses/MIT).

## Code of Conduct

Everyone interacting in the PdfMaster project’s codebases, issue trackers, chat rooms, and mailing lists is expected to follow the [code of conduct](https://github.com/Atharva-System/PdfMaster/blob/master/CODE_OF_CONDUCT.md).

