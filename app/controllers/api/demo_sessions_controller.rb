class Api::DemoSessionsController < Api::BaseController
  skip_before_action :authenticate_user!
  skip_before_action :enforce_demo_read_only!

  def create
    unless ActiveModel::Type::Boolean.new.cast(ENV.fetch("DEMO_MODE_ENABLED", "false"))
      return render json: { error: "demo_disabled" }, status: :service_unavailable
    end

    workspace = Workspace.find_by(kind: "demo")
    user = workspace&.users&.find_by(demo_account: true)
    return render json: { error: "demo_unavailable" }, status: :service_unavailable unless user

    set_jwt_cookie!(user)
    render json: {
      user: authentication_user_payload(user),
      exp: 15.minutes.from_now.to_i
    }
  end
end
