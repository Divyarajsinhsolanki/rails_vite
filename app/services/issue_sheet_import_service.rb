class IssueSheetImportService
  HEADER_MAP = {
    "taskcreated" => :task_id,
    "issuefoundby" => :found_by,
    "date" => :found_on,
    "module" => :module_name,
    "submodule" => :sub_module,
    "sectiondetail" => :section_detail,
    "issuedescription" => :issue_description,
    "attachment" => :attachment,
    "mf6app" => :mf6_app,
    "localqa" => :local_qa,
    "teamtestdevqa" => :team_test,
    "commentkajalteam" => :comment,
    "devcomments" => :dev_comments_dated,
    "developercomment" => :developer_comment,
    "qacomment" => :comment_qa
  }.freeze

  def initialize(project:, sheet_name:)
    @project = project
    @sheet_name = sheet_name
  end

  def call
    rows = GoogleSheetsReader.new(@sheet_name, @project.sheet_id).read_data
    return { created: 0, updated: 0, skipped: 0, total: 0 } if rows.blank?

    headers = Array(rows.first).map { |h| normalize_header(h) }
    created = 0
    updated = 0
    skipped = 0

    rows.drop(1).each do |row|
      attrs = build_attrs(headers, row)
      if attrs[:issue_description].blank?
        skipped += 1
        next
      end

      issue = find_existing_issue(attrs)
      issue.assign_attributes(attrs)
      issue.title = build_title(attrs) if issue.title.blank?

      if issue.new_record?
        if issue.save
          created += 1
        else
          skipped += 1
        end
      elsif issue.changed?
        if issue.save
          updated += 1
        else
          skipped += 1
        end
      else
        skipped += 1
      end
    end

    { created: created, updated: updated, skipped: skipped, total: rows.length - 1 }
  end

  private

  def build_attrs(headers, row)
    attrs = {}
    headers.each_with_index do |header, idx|
      target = HEADER_MAP[header]
      next unless target

      value = row[idx].to_s.strip
      next if value.blank?

      attrs[target] = target == :found_on ? parse_date(value) : value
    end
    attrs
  end

  def find_existing_issue(attrs)
    Issue.where(project_id: @project.id)
         .where(issue_description: attrs[:issue_description], module_name: attrs[:module_name], sub_module: attrs[:sub_module])
         .where(found_on: attrs[:found_on])
         .first_or_initialize
  end

  def build_title(attrs)
    [
      attrs[:module_name],
      attrs[:sub_module],
      attrs[:issue_description]
    ].compact.join(" - ").truncate(120)
  end

  def parse_date(value)
    Date.parse(value)
  rescue ArgumentError
    nil
  end

  def normalize_header(value)
    value.to_s.downcase.gsub(/[^a-z0-9]/, "")
  end
end
