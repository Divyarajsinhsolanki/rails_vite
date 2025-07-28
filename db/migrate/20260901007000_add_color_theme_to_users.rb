class AddColorThemeToUsers < ActiveRecord::Migration[7.1]
  def change
    add_column :users, :color_theme, :string, default: 'blue'
  end
end
