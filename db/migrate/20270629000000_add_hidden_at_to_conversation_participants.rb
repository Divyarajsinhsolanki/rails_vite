class AddHiddenAtToConversationParticipants < ActiveRecord::Migration[7.1]
  def change
    add_column :conversation_participants, :hidden_at, :datetime
    add_index :conversation_participants, [:user_id, :hidden_at]
  end
end
