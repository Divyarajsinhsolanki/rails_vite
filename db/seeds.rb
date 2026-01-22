# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).
#
# Example:
#
#   ["Action", "Comedy", "Drama", "Horror"].each do |genre_name|
#     MovieGenre.find_or_create_by!(name: genre_name)
#   end

# Default Roles
%w[owner admin member].each do |name|
  Role.find_or_create_by!(name: name)
end

# Default Teams
%w[ROR React Python QA DevOps Design].each do |name|
  Team.find_or_create_by!(name: name)
end

# Default Projects
[
  "MyForms",
  "AI",
  "AC Space",
  "Portal",
  "DataHub"
].each do |name|
  Project.find_or_create_by!(name: name)
end

# Sample media URLs for random attachment
sample_images = [
  'https://placehold.co/600x400/3b82f6/ffffff.png?text=Screenshot+1',
  'https://placehold.co/600x400/ef4444/ffffff.png?text=Bug+Report',
  'https://placehold.co/600x400/22c55e/ffffff.png?text=Test+Result',
  'https://placehold.co/600x400/f59e0b/ffffff.png?text=UI+Issue',
  'https://placehold.co/600x400/8b5cf6/ffffff.png?text=Error+Screen'
]

sample_videos = [
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
]

# Get random users for reporter/assignee
all_users = User.all.to_a
all_developers = Developer.all.to_a

# Seed starter issues for the first project to make the Issue Tracker feel alive
first_project = Project.order(:id).first || Project.create!(name: 'Demo Project')

rng_issues = Random.new(20_260_122)

# Spreadsheet-based issues data
spreadsheet_issues = [
  {
    issue_key: 'ISS-2001',
    title: '"Report Type" Dropdown options are not showing with checkbox while submit once and again click on Workflow Productivity Report link',
    status: 'Not Reproducible',
    severity: 'Medium',
    category: 'Functional',
    module_name: 'Admin',
    sub_module: 'Admin',
    section_detail: nil,
    found_by: 'Praveen',
    found_on: Date.new(2025, 2, 12),
    mf6_app: 'Y',
    local_qa: 'N',
    team_test: 'N',
    comment_qa: 'Not Reproducible',
    dev_comments_dated: 'Not Reproducible',
    developer_comment: 'reproducible',
    issue_description: '"Report Type" Dropdown options are not showing with checkbox while submit once and again click on Workflow Productivity Report link',
    pre_conditions: "- User should have valid credentials of MyForms application.\n- User should have Company Admin user role.",
    repro_steps: "- Login into the MyForms application with valid credentials and available company.\n- Click on \"Admin\" section.\n- Click on \"Workflow productivity report\" link\n- Fill \"Date\" field and \"report type\" dropdown with all three checkbox selected\n- Click on \"Submit\" button\n- Again click on \"Workflow productivity report\" link\n- Observe the \"report type\" dropdown",
    actual_result: '- "Report type" dropdown options are not showing with checkbox',
    expected_result: '- "Report type" dropdown options should show with checkbox'
  },
  {
    issue_key: 'ISS-2002',
    title: '"Workflow Productivity Report" title is not showing in single line',
    status: 'In Progress',
    severity: 'Low',
    category: 'UI',
    module_name: 'Admin',
    sub_module: 'Admin',
    section_detail: nil,
    found_by: 'Praveen',
    found_on: Date.new(2025, 2, 12),
    mf6_app: 'Y',
    local_qa: nil,
    team_test: nil,
    comment_qa: 'reproducible',
    dev_comments_dated: 'Reproducible',
    developer_comment: 'reproducible',
    issue_description: '"Workflow Productivity Report" title is not showing in single line.',
    pre_conditions: "- User should have valid credentials of MyForms application.\n- User should have Company Admin user role.",
    repro_steps: "- Login into the MyForms application with valid credentials and available company.\n- Click on \"Admin\" section.\n- Click on \"Workflow Productivity Report\" link\n- Observe the \"Workflow Productivity Report\" title",
    actual_result: '- "Workflow Productivity Report" title is not showing in single line.',
    expected_result: '- "Workflow Productivity Report" title should show in single line.'
  },
  {
    issue_key: 'ISS-2003',
    title: '"Document set group" dropdown is showing on "Add Document set" popup',
    status: 'Not an issue',
    severity: 'Medium',
    category: 'Functional',
    module_name: 'My Database',
    sub_module: 'Documents',
    section_detail: 'My Database > Documents > Document set',
    found_by: 'Praveen',
    found_on: Date.new(2025, 2, 13),
    mf6_app: 'Y',
    local_qa: 'N',
    team_test: 'N',
    comment_qa: 'Not an issue',
    dev_comments_dated: nil,
    developer_comment: 'That is not an issue; it is the intended functionality. If the logged-in company ID and the library source company ID (WF_TEMPLATE_SRC_COMPANY_ID) are the same, then the document type dropdown should be displayed.',
    issue_description: '"Document set group" dropdown is showing on "Add Document set" popup',
    pre_conditions: '- User should have valid credentials of MyForms application.',
    repro_steps: "- Login into the MyForms application with valid credentials and available company.\n- Click on \"MyDatabase\" Module.\n- Click on \"Document set\" link in Document section\n- Click on \"Add Document Set\" link\n- Observe the \"Document set group\" dropdown on popup",
    actual_result: '- "Document set group" dropdown is showing on "Add Document set" popup',
    expected_result: '- "Document set group" dropdown should not show on popup.'
  },
  {
    issue_key: 'ISS-2004',
    title: '"Publish To Document Template Library" checkbox and "Document Set Group" dropdown is showing on edit Document set',
    status: 'Not an issue',
    severity: 'Medium',
    category: 'Functional',
    module_name: 'My Database',
    sub_module: 'Documents',
    section_detail: 'My Database > Document > Document set',
    found_by: 'Praveen',
    found_on: Date.new(2025, 2, 13),
    mf6_app: 'Y',
    local_qa: 'N',
    team_test: 'N',
    comment_qa: 'Not an issue',
    dev_comments_dated: nil,
    developer_comment: 'That is not an issue; it is the intended functionality.',
    issue_description: '"Publish To Document Template Library" checkbox and "Document Set Group" dropdown is showing on edit Document set',
    pre_conditions: '- User should have valid credentials of MyForms application.',
    repro_steps: "- Login into the MyForms application with valid credentials and available company.\n- Click on \"MyDatabase\" Module.\n- Click on \"Document set\" link in Document section\n- Click on any \"Document Set\" name\n- Click on \"Edit\" link\n- Observe the fields on \"Set Info\" section",
    actual_result: '- "Publish To Document Template Library" checkbox and "Document Set Group" dropdown is showing with set info fields',
    expected_result: "- Only below mentioned set info fields should show on \"Set info\" section\n- Set Title textfield\n- Workflow dropdown\n- Enabled checkbox"
  },
  {
    issue_key: 'ISS-2005',
    title: '"Document Template Library" link is not showing in document section',
    status: 'Not an issue',
    severity: 'Medium',
    category: 'Functional',
    module_name: 'My Database',
    sub_module: 'Documents',
    section_detail: 'My Database > Document section',
    found_by: 'Praveen',
    found_on: Date.new(2025, 2, 13),
    mf6_app: 'Y',
    local_qa: 'N',
    team_test: 'N',
    comment_qa: 'Not an issue',
    dev_comments_dated: nil,
    developer_comment: 'That is not an issue; because the logged-in company ID and the library source company ID (WF_TEMPLATE_SRC_COMPANY_ID) are the same.',
    issue_description: '"Document Template Library" link is not showing in document section',
    pre_conditions: '- User should have valid credentials of MyForms application.',
    repro_steps: "- Login into the MyForms application with valid credentials and available company.\n- Click on \"MyDatabase\" Module.\n- Observe the links on \"Document\" section",
    actual_result: '- "Document Template Library" link is not showing in document section',
    expected_result: '- "Document Template Library" link should show with all links in document section'
  },
  {
    issue_key: 'ISS-2007',
    title: '"Workflow Template Library" link is not showing in Workflow section',
    status: 'Not an issue',
    severity: 'Medium',
    category: 'Functional',
    module_name: 'My Database',
    sub_module: 'Workflows',
    section_detail: 'My Database > Workflow section > Workflow Templates library',
    found_by: 'Praveen',
    found_on: Date.new(2025, 2, 18),
    mf6_app: 'Y',
    local_qa: 'N',
    team_test: 'N',
    comment_qa: 'Not an issue',
    dev_comments_dated: nil,
    developer_comment: 'That is not an issue; because the logged-in company ID and the library source company ID (WF_TEMPLATE_SRC_COMPANY_ID) are the same.',
    issue_description: '"Workflow Template Library" link is not showing in Workflow section',
    pre_conditions: '- User should have valid credentials of MyForms application.',
    repro_steps: "- Login into the MyForms application with valid credentials and available company.\n- Click on \"MyDatabase\" Module.\n- Observe the links on \"Workflow\" section",
    actual_result: '- "Workflow Template Library" link is not showing in Workflow section',
    expected_result: '- "Workflow Template Library" link should show in Workflow section'
  },
  {
    issue_key: 'ISS-2008',
    title: 'Unable to login with Client and Physician user when sign up from Sign up page',
    status: 'Retest',
    severity: 'High',
    category: 'Functional',
    module_name: 'Sign Up',
    sub_module: 'Clinician & Physician',
    section_detail: 'Sign Up > Clinician & Physician',
    found_by: 'Praveen',
    found_on: Date.new(2025, 3, 13),
    mf6_app: 'Y',
    local_qa: 'N',
    team_test: 'N',
    comment_qa: 'Retest once deployed',
    dev_comments_dated: nil,
    developer_comment: 'Currently, we have not upgraded the recipient-side code. This issue is related to recipient-side code changes',
    sprint_name: 'T2',
    issue_description: 'Unable to login with Client and Physician user when sign up from Sign up page.',
    pre_conditions: '- User should have valid credentials of MyForms application.',
    repro_steps: "- Login into the MyForms application with valid credentials and available company.\n- Click on \"Sign up for one today.\" link.\n- Create \"Clinician\" and \"Physician\" user.\n- Verify the email from email verification process.\n- Now login with the user credentials.\n- Observe the result",
    actual_result: '- User is unable to login with credentials.',
    expected_result: '- User should be able to login with credentials.'
  },
  {
    issue_key: 'ISS-2009',
    title: '"Insurance provider" field list is showing on Form builder',
    status: 'Not an issue',
    severity: 'Medium',
    category: 'Functional',
    module_name: 'My Database',
    sub_module: 'Documents',
    section_detail: 'My Database > Document section > Document Templates > Form Builder',
    found_by: 'Praveen',
    found_on: Date.new(2025, 3, 17),
    mf6_app: 'Y',
    local_qa: 'N',
    team_test: 'N',
    comment_qa: 'Not an issue',
    dev_comments_dated: nil,
    developer_comment: 'That is not an issue, it is a functionality',
    sprint_name: 'T2',
    issue_description: '"Insurance provider" field list is showing on Form builder.',
    pre_conditions: '- User should have valid credentials of MyForms application.',
    repro_steps: "- Login into the MyForms application with valid credentials and available company.\n- Click on \"MyDatabase\" Module.\n- Click on \"Document template\" link.\n- Click on document template name link which have pdf file type.\n- Click on Form builder link.\n- Observe the fields list on \"Form builders\" right panel.",
    actual_result: '- "Insurance provider" field list is showing on Form builder.',
    expected_result: '- "Insurance provider" field list should not show on Form builder.'
  },
  {
    issue_key: 'ISS-2010',
    title: 'Duplicate fields list are showing in form builder',
    status: 'Need to discuss',
    severity: 'Medium',
    category: 'Functional',
    module_name: 'My Database',
    sub_module: 'Documents',
    section_detail: 'My Database > Document section > Document Templates > Form Builder',
    found_by: 'Praveen',
    found_on: Date.new(2025, 3, 17),
    mf6_app: 'Y',
    local_qa: 'N',
    team_test: 'N',
    comment_qa: 'Need to discuss',
    dev_comments_dated: nil,
    developer_comment: 'That is not an issue, it is related to bad data records that`s why two times shows field',
    sprint_name: 'T2',
    issue_description: 'Duplicate fields list are showing in form builder',
    pre_conditions: "- User should have valid credentials of MyForms application.\n- BETA-Patient-Insurance-Policies flag should be enable.",
    repro_steps: "- Login into the MyForms application with valid credentials and available company.\n- Click on \"MyDatabase\" Module.\n- Click on \"Document template\" link.\n- Click on document template name link which have pdf file type.\n- Click on Form builder link.\n- Click on Insurance Policies field list.\n- Observe the fields list.",
    actual_result: '- Duplicate field list are showing in Insurance Policies field during form builder.',
    expected_result: '- Duplicate field list should not show in Insurance Policies field during form builder.'
  },
  {
    issue_key: 'ISS-2011',
    title: 'Extra fields are showing in Patient field list during Form Builder',
    status: 'In Progress',
    severity: 'Medium',
    category: 'Functional',
    module_name: 'My Database',
    sub_module: 'Documents',
    section_detail: 'My Database > Document section > Document Templates > Form Builder',
    found_by: 'Praveen',
    found_on: Date.new(2025, 3, 17),
    mf6_app: 'Y',
    local_qa: 'N',
    team_test: 'N',
    comment_qa: 'reproducible',
    dev_comments_dated: nil,
    developer_comment: 'That is not an issue verified in rails 4, it is a functionality',
    sprint_name: 'T2',
    issue_description: 'Extra fields are showing in Patient field list during Form Builder',
    pre_conditions: '- User should have valid credentials of MyForms application.',
    repro_steps: "- Login into the MyForms application with valid credentials and available company.\n- Click on \"MyDatabase\" Module.\n- Click on \"Document template\" link.\n- Click on document template name link which have pdf file type.\n- Click on Form builder link.\n- Click on Patient field list.\n- Observe the patient fields list fields.",
    actual_result: '- Duplicate fields are showing in patient field list during form builder.',
    expected_result: '- Duplicate fields should not show in Patient field list during form builder.'
  },
  {
    issue_key: 'ISS-2013',
    title: 'Validation message is not showing on search Clinician',
    status: 'In Progress',
    severity: 'Medium',
    category: 'Functional',
    module_name: 'My Database',
    sub_module: 'Contacts',
    section_detail: 'My Database > Contacts > Clinician',
    found_by: 'Praveen',
    found_on: Date.new(2025, 3, 18),
    mf6_app: 'Y',
    local_qa: nil,
    team_test: nil,
    comment_qa: 'reproducible',
    dev_comments_dated: 'Reproducible',
    developer_comment: 'reproducible',
    sprint_name: 'T2',
    issue_description: 'Validation message is not showing on search Clinician.',
    pre_conditions: '- User should have valid credentials of MyForms application.',
    repro_steps: "- Login into the MyForms application with valid credentials and available company.\n- Click on \"MyDatabase\" Module.\n- Click on \"Clinician\" link on Contacts section.\n- Click on Search button with blank search field\n- Observe the result.",
    actual_result: 'All clinician data is displaying',
    expected_result: 'Validation message should be show.'
  },
  {
    issue_key: 'ISS-2014',
    title: 'Spinner is continuously showing when search a physician',
    status: 'In Progress',
    severity: 'High',
    category: 'Functional',
    module_name: 'My Database',
    sub_module: 'Contacts',
    section_detail: 'My Database > Contacts > Physician',
    found_by: 'Praveen',
    found_on: Date.new(2025, 3, 18),
    mf6_app: 'Y',
    local_qa: nil,
    team_test: nil,
    comment_qa: 'reproducible',
    dev_comments_dated: 'Reproducible, Related to pagination',
    developer_comment: 'reproducible',
    sprint_name: 'T2',
    issue_description: 'Spinner is continuously showing when search a physician',
    pre_conditions: '- User should have valid credentials of MyForms application.',
    repro_steps: "- Login into the MyForms application with valid credentials and available company.\n- Click on \"MyDatabase\" Module.\n- Click on \"Physician\" link on Contacts section.\n- Enter any text in text fields and Click on Search button\n- Observe the result.",
    actual_result: 'Spinner is continuously showing and 500 server error is showing in console',
    expected_result: 'Physician data should show based on search field content'
  },
  {
    issue_key: 'ISS-2015',
    title: 'Two successful popup message are showing on clone a document set',
    status: 'In Progress',
    severity: 'Low',
    category: 'Functional',
    module_name: 'My Database',
    sub_module: 'Documents',
    section_detail: 'My Database > Document > Document set',
    found_by: 'Praveen',
    found_on: Date.new(2025, 3, 19),
    mf6_app: 'Y',
    local_qa: 'N',
    team_test: 'N',
    comment_qa: 'reproducible',
    dev_comments_dated: 'Not Reproducible',
    developer_comment: 'reproducible',
    sprint_name: 'T2',
    issue_description: 'Two successful popup message are showing on clone a document set',
    pre_conditions: "- User should have valid credentials of MyForms application.\n- Respective document set should be created",
    repro_steps: "- Login into the MyForms application with valid credentials and available company.\n- Click on \"MyDatabase\" Module.\n- Click on \"Document set\" link on Contacts section.\n- Click on a Document set name and click on Clone link\n- Observe the result.",
    actual_result: 'Two successful popup message are showing on clone a document set',
    expected_result: 'One successful popup message should show on clone a document set'
  },
  {
    issue_key: 'ISS-2016',
    title: 'Insurance provider name is not get add from select link on change condition popup of document set',
    status: 'Not Reproducible',
    severity: 'Medium',
    category: 'Functional',
    module_name: 'My Database',
    sub_module: 'Documents',
    section_detail: 'My Database > Document > Document set',
    found_by: 'Praveen',
    found_on: Date.new(2025, 3, 19),
    mf6_app: 'Y',
    local_qa: 'N',
    team_test: 'N',
    comment_qa: 'Not Reproducible',
    dev_comments_dated: 'Not Reproducible',
    developer_comment: 'reproducible',
    sprint_name: 'T2',
    issue_description: 'Insurance provider name is not get add from select link on change condition popup of document set',
    pre_conditions: "- User should have valid credentials of MyForms application.\n- Respective document set should be created",
    repro_steps: "- Login into the MyForms application with valid credentials and available company.\n- Click on \"MyDatabase\" Module.\n- Click on \"Document set\" link on Contacts section.\n- Click on Change condition link\n- Enter insurance provider name in searchbar and click on select link\n- Observe the result.",
    actual_result: 'Insurance provider name is not get add from select link.',
    expected_result: 'Insurance provider name should add from select link.'
  },
  {
    issue_key: 'ISS-2017',
    title: 'Item name is not get add from select link when search from item id, item name or HCPCS code',
    status: 'Blocked',
    severity: 'High',
    category: 'Functional',
    module_name: 'My Database',
    sub_module: 'Documents',
    section_detail: 'My Database > Document > Document set',
    found_by: 'Praveen',
    found_on: Date.new(2025, 3, 19),
    mf6_app: 'Y',
    local_qa: 'N',
    team_test: 'N',
    comment_qa: 'reproducible',
    dev_comments_dated: 'Not Reproducible',
    developer_comment: 'reproducible',
    sprint_name: 'T2',
    issue_description: 'Item name is not get add from select link when search from item id, item name or HCPCS code',
    pre_conditions: "- User should have valid credentials of MyForms application.\n- Respective document set should be created",
    repro_steps: "- Login into the MyForms application with valid credentials and available company.\n- Click on \"MyDatabase\" Module.\n- Click on \"Document set\" link on Contacts section.\n- Click on Change condition link\n- Move to item type popup from Next button\n- Select \"Brightree item\" from Item type dropdown\n- Enter Item id, Item name or HCPCS code and click on search button\n- Observe the result.",
    actual_result: 'Item is not getting add and showing 500 server error on console.',
    expected_result: 'Item should be add on search from item id, item name or HCPCS code'
  },
  {
    issue_key: 'ISS-2018',
    title: 'Diagnosis code are not get added on add button click',
    status: 'Not Reproducible',
    severity: 'Medium',
    category: 'Functional',
    module_name: 'My Database',
    sub_module: 'Documents',
    section_detail: 'My Database > Document > Document set',
    found_by: 'Praveen',
    found_on: Date.new(2025, 3, 20),
    mf6_app: 'Y',
    local_qa: 'N',
    team_test: 'N',
    comment_qa: 'Not Reproducible',
    dev_comments_dated: 'Not Reproducible',
    developer_comment: 'reproducible',
    sprint_name: 'T2',
    issue_description: 'Diagnosis code are not get added on add button click',
    pre_conditions: "- User should have valid credentials of MyForms application.\n- Respective document set should be created",
    repro_steps: "- Login into the MyForms application with valid credentials and available company.\n- Click on \"MyDatabase\" Module.\n- Click on \"Document set\" link on Contacts section.\n- Click on Change condition link\n- Move to Diagnosis page from Next button click\n- Select \"Search diagnosis\" from dropdown\n- \"Enter diagnosis name or code\" in field\n- Click on Search button\n- Click on Add button from searched result names\n- Observe the result.",
    actual_result: 'Diagnosis code are not get added on add button click and 500 server error is showing in console.',
    expected_result: 'Diagnosis code should be add on page.'
  },
  {
    issue_key: 'ISS-2019',
    title: 'Double quotes are displayed in "Documents template" section after assign respective document template in the Document Type',
    status: 'In Progress',
    severity: 'Low',
    category: 'Functional',
    module_name: 'My Database',
    sub_module: 'Documents',
    section_detail: 'My Database > Document > Document Type',
    found_by: 'Praveen',
    found_on: Date.new(2025, 3, 20),
    mf6_app: 'Y',
    local_qa: 'N',
    team_test: 'N',
    comment_qa: 'reproducible',
    dev_comments_dated: 'Not Reproducible',
    developer_comment: 'reproducible',
    sprint_name: 'T2',
    issue_description: 'Double quotes are displayed in "Documents template" section after assign respective document template in the Document Type',
    pre_conditions: "- User should have valid credentials of MyForms application.\n- Respective document template should be created.\n- Respective document types should be created.",
    repro_steps: "- Login into the MyForms application with valid credentials and available company.\n- Click on \"My Database\" link\n- Click on \"Document Type\" link\n- Click on any Document Type \"Edit\" link\n- Select a document template from the list under \"Documents template\" section\n- Click on Assign button\n- Observe the page",
    actual_result: 'Double quotes are displayed in "Documents template" section after assign respective document template in the Document Type',
    expected_result: 'Double quotes should not display in "Documents template" section'
  },
  {
    issue_key: 'ISS-2020',
    title: '400 console error is displaying while trying to copy paste long message in comment box for previous item comments',
    status: 'Need to discuss',
    severity: 'Low',
    category: 'Functional',
    module_name: 'My Database',
    sub_module: 'Custom Texts',
    section_detail: 'My Database > Custom Text > Previous Item Comment',
    found_by: 'Praveen',
    found_on: Date.new(2025, 3, 20),
    mf6_app: 'Y',
    local_qa: nil,
    team_test: nil,
    comment_qa: 'Need to discuss',
    dev_comments_dated: 'Low priority',
    developer_comment: 'Need to confirmed with divyaraj',
    sprint_name: 'T2',
    issue_description: '400 console error is displaying while trying to copy paste long message in comment box for previous item comments.',
    pre_conditions: '- User should have valid credentials of MyForms application.',
    repro_steps: "- Login into the MyForms application with valid credentials and available respective company.\n- Click on \"My Database\" link\n- Click on \"Previous Item Comment\" link\n- Enter some message in comment box\n- Open console\n- Copy entered message and paste it multiple times\n- Observe console error",
    actual_result: '400 console error is displaying while trying to copy paste long message in comment box for previous item comments.',
    expected_result: 'Console error should not be displayed for copy paste value or manually entered values'
  }
]

# Create issues from spreadsheet data
spreadsheet_issues.each do |attrs|
  # Pick random reporter and assignee from users
  reporter = all_users.sample(random: rng_issues)
  assignee_user = all_users.sample(random: rng_issues)

  # Randomly add media to some issues
  media = []
  if rng_issues.rand < 0.4
    media = [sample_images.sample(random: rng_issues)]
    media << sample_videos.sample(random: rng_issues) if rng_issues.rand < 0.3
  end

  # Build comment thread
  comment_thread = []
  if attrs[:comment_qa].present?
    comment_thread << { user: 'QA Team', text: attrs[:comment_qa], timestamp: Time.current.iso8601 }
  end
  if attrs[:developer_comment].present?
    comment_thread << { user: assignee_user&.full_name || 'Developer', text: attrs[:developer_comment], timestamp: Time.current.iso8601 }
  end

  Issue.find_or_create_by!(project: first_project, issue_key: attrs[:issue_key]) do |issue|
    issue.assign_attributes(attrs.except(:issue_key).merge(
      reporter_id: reporter&.id,
      assignee_user_id: assignee_user&.id,
      assignee: assignee_user&.full_name,
      owner: reporter&.full_name,
      owner_email: reporter&.email,
      assignee_email: assignee_user&.email,
      media_urls: media,
      comment: comment_thread.any? ? comment_thread.to_json : nil
    ))
  end
end

puts "Created #{spreadsheet_issues.size} issues from spreadsheet data"


# Default Work Priorities
[
  { name: 'High', color: 'bg-red-500', hex: '#ef4444' },
  { name: 'Medium', color: 'bg-yellow-500', hex: '#f59e0b' },
  { name: 'Low', color: 'bg-green-500', hex: '#10b981' }
].each do |priority|
  WorkPriority.find_or_create_by!(name: priority[:name]) do |p|
    p.color = priority[:color]
    p.hex = priority[:hex]
  end
end

# Default Work Categories
[
  { name: 'Development', color: 'bg-blue-500', hex: '#3b82f6' },
  { name: 'Meeting', color: 'bg-green-500', hex: '#22c55e' },
  { name: 'Research', color: 'bg-purple-500', hex: '#a855f7' },
  { name: 'Design', color: 'bg-pink-500', hex: '#ec4899' },
  { name: 'Code Review', color: 'bg-indigo-500', hex: '#6366f1' },
  { name: 'Break', color: 'bg-yellow-500', hex: '#eab308' },
  { name: 'Learning', color: 'bg-teal-500', hex: '#14b8a6' },
  { name: 'Planning', color: 'bg-amber-500', hex: '#f59e0b' }
].each do |category|
  WorkCategory.find_or_create_by!(name: category[:name]) do |c|
    c.color = category[:color]
    c.hex = category[:hex]
  end
end

# Default Work Tags
work_tags = [
  'Team',
  'Sync',
  'Frontend',
  'React',
  'UI/UX',
  'Figma',
  'Backend',
  'Code Review',
  'Frontend',
  'Research'
].uniq

work_tags.each do |tag_name|
  WorkTag.find_or_create_by!(name: tag_name)
end

# Departments
departments = [
  'Unassigned',
  '.Net',
  'Analytics',
  'BA',
  'Design',
  'Digital Marketing',
  'HR',
  'Information Security',
  'Magento',
  'Management',
  'Meanstack',
  'Mobile',
  'Odoo',
  'PHP',
  'QA',
  'React',
  'ROR',
  'Sales',
  'Sales & Marketing',
  'SEO',
  'Shopify',
  'SRE'
].uniq

departments.each do |dept_name|
  Department.find_or_create_by!(name: dept_name)
end

# Existing users who will receive seeded data
users = User.all.to_a

if users.empty?
  warn 'No users found. Skipping skill, goal, and endorsement seeding.'
end

# Professional Skills
skill_names = [
  'Ruby on Rails',
  'JavaScript',
  'React',
  'TypeScript',
  'PostgreSQL',
  'Docker',
  'Kubernetes',
  'AWS Architecture',
  'CI/CD Pipelines',
  'Automated Testing',
  'UI/UX Design',
  'Figma',
  'Agile Coaching',
  'Project Planning',
  'API Design',
  'Mobile Development',
  'Data Modeling',
  'Machine Learning',
  'Performance Optimization',
  'Security Auditing'
].uniq

# Normalize to match model titleize/strip before lookup to avoid duplicate validation
normalized_skill_names = skill_names.map { |name| name.to_s.strip.titleize }.uniq
skills = normalized_skill_names.map { |name| Skill.find_or_create_by!(name: name) }

rng = Random.new(20_240_519)

# Assign skills to every user with varied proficiency levels
users.each do |user|
  assigned_skills = skills.sample([skills.size, 5].min, random: rng)

  assigned_skills.each do |skill|
    user_skill = UserSkill.find_or_initialize_by(user: user, skill: skill)
    user_skill.proficiency = UserSkill::PROFICIENCY_LEVELS.sample(random: rng)
    user_skill.save!
  end
end

# Create learning goals for each user
goal_templates = [
  { title: 'Improve Automated Testing Coverage', description: 'Increase the project test suite coverage with additional unit and integration tests.', due_in_days: 30, progress_options: [25, 50, 75] },
  { title: 'Master Advanced React Patterns', description: 'Explore and implement advanced patterns in React including hooks and performance optimizations.', due_in_days: 45, progress_options: [0, 25, 50] },
  { title: 'Optimize Database Queries', description: 'Audit slow queries and apply indexing strategies to improve performance.', due_in_days: 40, progress_options: [50, 75, 90] },
  { title: 'Earn AWS Certification', description: 'Study for and pass the AWS Solutions Architect certification.', due_in_days: 60, progress_options: [10, 40, 70] },
  { title: 'Design System Refresh', description: 'Update the component library and align the design system with latest branding.', due_in_days: 35, progress_options: [20, 45, 65] },
  { title: 'Mobile Accessibility Audit', description: 'Conduct an accessibility audit on the mobile app and outline improvements.', due_in_days: 25, progress_options: [30, 55, 80] }
]

users.each do |user|
  goal_templates.sample(3, random: rng).each do |template|
    goal = user.learning_goals.find_or_initialize_by(title: template[:title])
    goal.description = template[:description]
    goal.due_date = Date.current + template[:due_in_days]
    goal.progress = template[:progress_options].sample(random: rng)
    goal.save!
  end
end

# Skill endorsements from peers
endorsement_notes = [
  'Consistently delivers high-quality work.',
  'Great collaborator and always willing to help.',
  'Demonstrates strong ownership of complex tasks.',
  'Shows impressive attention to detail.',
  'A go-to person for mentoring teammates.'
]

users.each do |user|
  user.user_skills.includes(:skill).each do |user_skill|
    potential_endorsers = users.reject { |endorser| endorser == user }
    next if potential_endorsers.empty?

    max_endorsements = [potential_endorsers.size, 3].min
    endorsement_count = max_endorsements.zero? ? 0 : rng.rand(1..max_endorsements)
    next if endorsement_count.zero?

    potential_endorsers.sample(endorsement_count, random: rng).each do |endorser|
      SkillEndorsement.find_or_create_by!(user_skill: user_skill, endorser: endorser) do |endorsement|
        endorsement.note = endorsement_notes.sample(random: rng)
      end
    end
  end
end
