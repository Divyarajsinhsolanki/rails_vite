class CreateSprints < ActiveRecord::Migration[7.1]
  def change
    create_table :sprints do |t|
      t.string  :name,        null: false
      t.date    :start_date,  null: false
      t.date    :end_date,    null: false
      t.text    :description

      t.timestamps
    end

    add_index :sprints, :start_date
    add_index :sprints, :end_date
  end
end
