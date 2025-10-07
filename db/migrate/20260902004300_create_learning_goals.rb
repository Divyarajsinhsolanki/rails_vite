class CreateLearningGoals < ActiveRecord::Migration[7.1]
  def change
    create_table :learning_goals do |t|
      t.references :user, null: false, foreign_key: true
      t.references :team, foreign_key: true
      t.string :title, null: false
      t.date :due_date
      t.integer :progress, null: false, default: 0
      t.text :description
      t.timestamps
    end
  end
end
