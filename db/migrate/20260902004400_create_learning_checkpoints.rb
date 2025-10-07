class CreateLearningCheckpoints < ActiveRecord::Migration[7.1]
  def change
    create_table :learning_checkpoints do |t|
      t.references :learning_goal, null: false, foreign_key: true
      t.string :title, null: false
      t.boolean :completed, null: false, default: false
      t.string :resource_url
      t.timestamps
    end
  end
end
