require 'digest'

class AddAvatarColorToUsers < ActiveRecord::Migration[7.1]
  class MigrationUser < ApplicationRecord
    self.table_name = 'users'
  end

  def up
    add_column :users, :avatar_color, :string

    MigrationUser.reset_column_information

    MigrationUser.find_each do |user|
      seed = user.email.presence || [user.first_name, user.last_name].compact.join(' ')
      user.update_columns(avatar_color: generate_avatar_color(seed))
    end
  end

  def down
    remove_column :users, :avatar_color
  end

  private

  def generate_avatar_color(seed)
    digest = Digest::SHA256.hexdigest(seed.to_s)
    hue = (digest[0, 2].to_i(16) / 255.0) * 360.0
    saturation = 0.62 + ((digest[2, 2].to_i(16) % 14) / 100.0)
    lightness = 0.45 + ((digest[4, 2].to_i(16) % 10) / 100.0)

    hsl_to_hex(hue, saturation, lightness)
  end

  def hsl_to_hex(hue, saturation, lightness)
    red, green, blue = hsl_to_rgb(hue, saturation, lightness)
    format('#%02x%02x%02x', red, green, blue)
  end

  def hsl_to_rgb(hue, saturation, lightness)
    chroma = (1 - (2 * lightness - 1).abs) * saturation
    hue_segment = hue / 60.0
    second_component = chroma * (1 - ((hue_segment % 2) - 1).abs)

    red1, green1, blue1 =
      case hue_segment
      when 0...1 then [chroma, second_component, 0]
      when 1...2 then [second_component, chroma, 0]
      when 2...3 then [0, chroma, second_component]
      when 3...4 then [0, second_component, chroma]
      when 4...5 then [second_component, 0, chroma]
      else [chroma, 0, second_component]
      end

    match = lightness - chroma / 2.0

    [
      ((red1 + match) * 255).round,
      ((green1 + match) * 255).round,
      ((blue1 + match) * 255).round
    ]
  end
end
