# frozen_string_literal: true

require "rails_helper"

RSpec.describe WorkPriority, type: :model do
  it "is valid with a name" do
    expect(described_class.new(name: "High")).to be_valid
  end

  it "is invalid without a name" do
    priority = described_class.new(name: nil)

    expect(priority).not_to be_valid
    expect(priority.errors[:name]).to include("can't be blank")
  end
end
