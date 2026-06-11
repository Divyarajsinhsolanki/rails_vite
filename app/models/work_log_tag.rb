class WorkLogTag < ApplicationRecord
  include WorkspaceScoped

  belongs_to :work_log, inverse_of: :work_log_tags
  belongs_to :work_tag, inverse_of: :work_log_tags
end
