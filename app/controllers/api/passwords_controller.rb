class Api::PasswordsController < Api::BaseController
  skip_before_action :authenticate_user!

  # POST /api/password/forgot
  def create
    email = params.dig(:password, :email).to_s.strip.downcase
    if email.present? && (user = User.find_by(email: email))
      user.send_reset_password_instructions
    end

    render json: { message: "If that email exists, a reset link is on its way." }
  end

  # POST /api/password/reset
  def update
    password_params = params.require(:password).permit(:token, :password, :password_confirmation)

    user = User.reset_password_by_token(
      reset_password_token: password_params[:token],
      password: password_params[:password],
      password_confirmation: password_params[:password_confirmation]
    )

    if user.errors.empty?
      render json: { message: "Password updated successfully." }
    else
      render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
    end
  end
end
