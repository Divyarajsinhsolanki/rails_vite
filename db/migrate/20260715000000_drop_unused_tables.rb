class DropUnusedTables < ActiveRecord::Migration[7.1]
  def change
    drop_table :notes, if_exists: true
    drop_table :quotes, if_exists: true
  end
end
