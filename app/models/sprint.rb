class Sprint < ApplicationRecord
  include UserStampable
  belongs_to :project
end