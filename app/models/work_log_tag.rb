class WorkLogTag < ApplicationRecord
  belongs_to :work_log
  belongs_to :work_tag
end
