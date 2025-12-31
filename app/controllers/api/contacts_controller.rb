class Api::ContactsController < ApplicationController
  skip_before_action :verify_authenticity_token

  def create
    unless valid_captcha?
      return render json: { errors: ['Invalid captcha answer'] }, status: :unprocessable_entity
    end

    contact = Contact.new(contact_params)
    if contact.save
      render json: { message: 'Thank you for your message!' }, status: :created
    else
      render json: { errors: contact.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def contact_params
    params.require(:contact).permit(:name, :email, :message)
  end

  def valid_captcha?
    contact_params = params[:contact]

    answer = contact_params&.dig(:captcha_answer)
    num1 = contact_params&.dig(:captcha_num1)
    num2 = contact_params&.dig(:captcha_num2)

    return false if [answer, num1, num2].any?(&:blank?)

    answer.to_i == num1.to_i + num2.to_i
  end
end
