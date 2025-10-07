class Api::SkillsController < Api::BaseController
  def index
    skills = Skill.alphabetical
    render json: skills.map { |skill| serialize(skill) }
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
