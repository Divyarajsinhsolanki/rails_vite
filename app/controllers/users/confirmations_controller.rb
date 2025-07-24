class Users::ConfirmationsController < Devise::ConfirmationsController
  protected

  # Redirect to /login after email confirmation and show a message.
  def after_confirmation_path_for(resource_name, resource)
    flash[:notice] = 'Your email has been confirmed. Please log in.'
    '/login?confirmed=1'
  end
end
