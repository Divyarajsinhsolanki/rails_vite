require 'spec_helper'

RSpec.describe PdfMaster do
  let(:sample_pdf) { 'spec/fixtures/sample.pdf' }
  let(:output_pdf) { 'spec/fixtures/output.pdf' }
  let(:another_pdf) { 'spec/fixtures/sample2.pdf' }
  let(:image_path) { 'spec/fixtures/sample_image.png' }
  let(:text) { 'Sample Text' }
  let(:watermark) { 'Confidential' }
  let(:link_text) { 'Click here' }
  let(:url) { 'https://example.com' }
  let(:header) { 'Header Text' }
  let(:footer) { 'Footer Text' }
  let(:text_to_redact) { 'Sensitive' }
  let(:custom_font_settings) { { family: 'Times-Roman', size: 14, style: :italic, color: 'FF0000' } }
  let(:received_stamp_name) { 'Received' }
  let(:received_stamp_degree) { 45 }
  let(:received_stamp_rotate_direction) { 'right' }
  
  before(:each) do
    FileUtils.cp('spec/fixtures/original_sample.pdf', sample_pdf) # Reset sample PDF
  end

  describe PdfMaster::Editor do
    it 'adds text to a PDF with default font settings' do
      expect { PdfMaster::Editor.add_text(sample_pdf, text, 100, 100, 1, :top_right) }.not_to raise_error
    end

    it 'adds text to a PDF with custom font settings' do
      expect { PdfMaster::Editor.add_text(sample_pdf, text, 100, 100, 1, :top_right, custom_font_settings) }.not_to raise_error
    end

    it 'adds an image to a PDF with default font settings' do
      expect { PdfMaster::Editor.add_image(sample_pdf, image_path, 100, 100, 2, :center) }.not_to raise_error
    end

    it 'adds a watermark to a PDF with default font settings' do
      expect { PdfMaster::Editor.add_watermark(sample_pdf, watermark, 50, 50, 1, :bottom_right) }.not_to raise_error
    end

    it 'adds a watermark to a PDF with custom font settings' do
      expect { PdfMaster::Editor.add_watermark(sample_pdf, watermark, 50, 50, 1, :bottom_right, custom_font_settings) }.not_to raise_error
    end

    it 'adds an annotation to a PDF with custom font settings' do
      expect { PdfMaster::Editor.add_annotation(sample_pdf, text, 50, 50, 2, :top_left, custom_font_settings) }.not_to raise_error
    end

    it 'adds a hyperlink to a PDF with custom font settings' do
      expect { PdfMaster::Editor.add_hyperlink(sample_pdf, link_text, url, 50, 50, 1, custom_font_settings) }.not_to raise_error
    end

    it 'redacts text in a PDF' do
      expect { PdfMaster::Editor.redact_text(sample_pdf, text_to_redact) }.not_to raise_error
    end

    it 'adds a header and footer to a PDF with custom font settings' do
      expect { PdfMaster::Editor.add_header_footer(sample_pdf, header, footer, custom_font_settings) }.not_to raise_error
    end

    it 'adds a received stamp to a PDF with default settings' do
      expect { PdfMaster::Editor.add_received_stamp(sample_pdf, received_stamp_name, nil, nil, 1, :top_left, received_stamp_degree, received_stamp_rotate_direction, custom_font_settings) }.not_to raise_error
    end
  end

  describe PdfMaster::Modify do
    it 'adds a blank page to a PDF' do
      expect { PdfMaster::Modify.add_page(sample_pdf, 2) }.not_to raise_error
    end

    it 'removes a page from a PDF' do
      expect { PdfMaster::Modify.remove_page(sample_pdf, 1) }.not_to raise_error
    end

    it 'rotates a page in a PDF' do
      expect { PdfMaster::Modify.rotate_page(sample_pdf, 90, 1) }.not_to raise_error
    end

    it 'duplicates a page in a PDF' do
      expect { PdfMaster::Modify.duplicate_pages(sample_pdf, 1) }.not_to raise_error
    end

    it 'merges multiple PDFs' do
      expect { PdfMaster::Modify.merge_pdfs(output_pdf, sample_pdf, another_pdf) }.not_to raise_error
    end

    it 'splits a PDF into two parts' do
      expect { PdfMaster::Modify.split_pdf(sample_pdf, 2) }.not_to raise_error
    end

    it 'extracts specific pages from a PDF' do
      expect { PdfMaster::Modify.extract_pages(sample_pdf, [1, 2], output_pdf) }.not_to raise_error
    end

    it 'rearranges pages in a PDF' do
      expect { PdfMaster::Modify.rearrange_pages(sample_pdf, :move_up, 2, 1) }.not_to raise_error
    end

    it 'encrypts a PDF with a password' do
      expect { PdfMaster::Modify.encrypt_pdf(sample_pdf, output_pdf, 'password123') }.not_to raise_error
    end

    it 'compresses a PDF' do
      expect { PdfMaster::Modify.compress_pdf(sample_pdf, output_pdf) }.not_to raise_error
    end

    it 'crops a page in a PDF' do
      expect { PdfMaster::Modify.crop_page(sample_pdf, 1, 50, 50, 200, 200) }.not_to raise_error
    end

    it 'adds page numbers to a PDF' do
      expect { PdfMaster::Modify.add_page_numbers(sample_pdf) }.not_to raise_error
    end

    it 'updates metadata in a PDF' do
      expect { PdfMaster::Modify.update_metadata(sample_pdf, title: 'Title') }.not_to raise_error
    end

    it 'removes metadata from a PDF' do
      expect { PdfMaster::Modify.remove_metadata(sample_pdf) }.not_to raise_error
    end

    it 'flattens form fields in a PDF' do
      expect { PdfMaster::Modify.flatten_form_fields(sample_pdf) }.not_to raise_error
    end

    it 'changes orientation of a PDF' do
      expect { PdfMaster::Modify.change_orientation(sample_pdf, :landscape) }.not_to raise_error
    end
  end
end
