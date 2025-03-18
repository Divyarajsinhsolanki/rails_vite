Rails.application.routes.draw do
  devise_for :users
  mount ActiveStorage::Engine => "/rails/active_storage"

  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  root "pages#index"

  post "/add_page", to: "pdfs#add_page"
  post "/remove_page", to: "pdfs#remove_page"
  post "/modify_pdf", to: "pdfs#modify"
  post "/upload_pdf", to: "pdfs#upload_pdf"
  post "/add_signature", to: "pdfs#add_signature"
  post "/add_watermark", to: "pdfs#add_watermark"
  post "/add_stamp", to: "pdfs#add_stamp"
  post "/rotate_left", to: "pdfs#rotate_left"
  post "/rotate_right", to: "pdfs#rotate_right"
  post "/merge_pdf", to: "pdfs#merge_pdf"
  post "/split_pdf", to: "pdfs#split_pdf"
  post "/encrypt_pdf", to: "pdfs#encrypt_pdf"
  post "/decrypt_pdf", to: "pdfs#decrypt_pdf"

  namespace :api do
    post 'signup', to: 'auth#signup'
    post 'login', to: 'auth#login'
    delete 'logout', to: 'auth#logout'
    resources :posts, only: [:index, :create, :update, :destroy]

    get 'view_profile', to: 'auth#view_profile'
    post 'update_profile', to: 'auth#update_profile'
  end
  get "*path", to: "pages#index", constraints: lambda { |req|
    !req.path.start_with?("/rails/active_storage")  # Don't redirect Active Storage URLs
  }
end
