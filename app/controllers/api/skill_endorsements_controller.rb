class Api::SkillEndorsementsController < Api::BaseController
  before_action :set_skill_endorsement, only: :destroy

  def create
    user_skill = UserSkill.find(skill_endorsement_params[:user_skill_id])
    team = skill_endorsement_params[:team_id].present? ? Team.find(skill_endorsement_params[:team_id]) : nil

    unless authorized_for_team?(team || user_skill.user.teams)
      return render json: { error: 'Not authorized to endorse this skill.' }, status: :forbidden
    end

    if team && !user_skill.user.teams.exists?(team.id)
      return render json: { errors: ['This skill is not associated with the selected team.'] }, status: :unprocessable_entity
    end

    endorsement = user_skill.skill_endorsements.build(endorser: current_user, team: team)

    if endorsement.save
      render json: serialize(endorsement), status: :created
    else
      render json: { errors: endorsement.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    return head :forbidden unless @skill_endorsement.endorser_id == current_user.id

    @skill_endorsement.destroy
    head :no_content
  end

  private

  def skill_endorsement_params
    params.require(:skill_endorsement).permit(:user_skill_id, :team_id)
  end

  def set_skill_endorsement
    @skill_endorsement = SkillEndorsement.find(params[:id])
  end

  def authorized_for_team?(team_or_collection)
    case team_or_collection
    when Team
      team_or_collection.users.exists?(current_user.id)
    else
      Array.wrap(team_or_collection).any? { |team| team.users.exists?(current_user.id) }
    end
  end

  def serialize(endorsement)
    {
      id: endorsement.id,
      user_skill_id: endorsement.user_skill_id,
      endorsements_count: endorsement.user_skill.endorsements_count,
      created_at: endorsement.created_at,
      endorser: {
        id: endorsement.endorser_id,
        name: endorsement.endorser.full_name
      },
      endorsee: {
        id: endorsement.user_skill.user_id,
        name: endorsement.user_skill.user.full_name
      },
      skill: {
        id: endorsement.user_skill.skill_id,
        name: endorsement.user_skill.skill.name
      }
    }
  end
end
