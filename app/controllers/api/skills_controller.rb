class Api::SkillsController < Api::BaseController
  def index
    skills = Skill.alphabetical
    render_paginated_collection(skills, serializer: method(:serialize))
  end

  private

  def serialize(skill)
    {
      id: skill.id,
      name: skill.name,
      category: skill.category
    }
  end
end
