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
    params[:contact][:captcha_answer].to_i ==
      params[:contact][:captcha_num1].to_i + params[:contact][:captcha_num2].to_i
  end
end
