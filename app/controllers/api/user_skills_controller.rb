class Api::UserSkillsController < Api::BaseController
  before_action :set_user_skill, only: [:update, :destroy]

  def index
    skills = current_user.user_skills.includes(:skill).ordered_by_skill_name
    render json: skills.map { |user_skill| serialize(user_skill) }
  end

  def create
    user_skill = current_user.user_skills.build
    assign_skill(user_skill)
    user_skill.proficiency = user_skill_params[:proficiency] if user_skill_params[:proficiency].present?

    if user_skill.save
      render json: serialize(user_skill), status: :created
    else
      render json: { errors: user_skill.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @user_skill.update(proficiency: user_skill_params[:proficiency])
      render json: serialize(@user_skill)
    else
      render json: { errors: @user_skill.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @user_skill.destroy
    head :no_content
  end

  private

  def set_user_skill
    @user_skill = current_user.user_skills.find(params[:id])
  end

  def user_skill_params
    params.require(:user_skill).permit(:skill_id, :name, :proficiency)
  end

  def assign_skill(user_skill)
    if user_skill_params[:skill_id].present?
      user_skill.skill = Skill.find(user_skill_params[:skill_id])
    elsif user_skill_params[:name].present?
      user_skill.skill = Skill.find_or_create_by!(name: user_skill_params[:name])
    else
      user_skill.errors.add(:skill, 'must exist')
    end
  end

  def serialize(user_skill)
    {
      id: user_skill.id,
      skill_id: user_skill.skill_id,
      name: user_skill.name,
      proficiency: user_skill.proficiency,
      proficiency_label: user_skill.proficiency_label,
      endorsements_count: user_skill.endorsements_count,
      last_endorsed_at: user_skill.last_endorsed_at
    }
  end
end
