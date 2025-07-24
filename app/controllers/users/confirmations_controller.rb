class Users::ConfirmationsController < Devise::ConfirmationsController
  protected

  # Redirect to the root login page after email confirmation and show a message.
  def after_confirmation_path_for(resource_name, resource)
    flash[:notice] = 'Your email has been confirmed. Please log in.'
    '/?confirmed=1'
  end
end
