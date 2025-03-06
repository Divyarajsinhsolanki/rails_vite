Rails.application.routes.draw do
  devise_for :users
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  root "pages#index"
  get "*path", to: "pages#index"

  post "/add_page", to: "pdfs#add_page"
  post "/remove_page", to: "pdfs#remove_page"
  post "/modify_pdf", to: "pdfs#modify"

  namespace :api do
    post 'signup', to: 'auth#signup'
    post 'login', to: 'auth#login'
    delete 'logout', to: 'auth#logout'
  end
end
