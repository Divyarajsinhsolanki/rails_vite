Rails.application.routes.draw do
  devise_for :users
  mount ActiveStorage::Engine => "/rails/active_storage"

  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  root "pages#index"

  # PDF
  post "/upload_pdf", to: "pdfs#upload_pdf"

  post "/api/update_pdf", to: "pdf_modifiers#update_pdf"

  post "/add_page", to: "pdf_modifiers#add_page"
  post "/remove_page", to: "pdf_modifiers#remove_page"

  post "/duplicate_page", to: "pdf_modifiers#duplicate_page"
  post "/replace_text", to: "pdf_modifiers#replace_text"

  post "/add_text", to: "pdf_modifiers#add_text"
  post "/add_signature", to: "pdf_modifiers#add_signature"

  post "/add_watermark", to: "pdf_modifiers#add_watermark"
  post "/add_stamp", to: "pdf_modifiers#add_stamp"

  post "/rotate_left", to: "pdf_modifiers#rotate_left"
  post "/rotate_right", to: "pdf_modifiers#rotate_right"

  post "/merge_pdf", to: "pdf_modifiers#merge_pdf"
  post "/split_pdf", to: "pdf_modifiers#split_pdf"

  post "/encrypt_pdf", to: "pdf_modifiers#encrypt_pdf"
  post "/decrypt_pdf", to: "pdf_modifiers#decrypt_pdf"

  namespace :api do
    post 'signup', to: 'auth#signup'
    post 'login', to: 'auth#login'
    delete 'logout', to: 'auth#logout'
    post   'refresh',       to: 'auth#refresh'
    get 'sprints/last', to: 'sprints#last'  
    get 'view_profile', to: 'auth#view_profile'
    post 'update_profile', to: 'auth#update_profile'
    get 'coding_tip', to: 'coding_tips#show'

    resources :users, only: [:index, :update, :destroy]
    resources :posts, only: [:index, :create, :update, :destroy]
    resources :sprints, only: [:index, :create, :update, :destroy]
    resources :developers, only: [:index]
    resources :tasks, only: [:index, :create, :update, :destroy]

    get 'admin/tables', to: 'admin#tables'
    get 'admin_meta/:table', to: 'admin#meta'
  
    scope 'admin/:table' do
      get '/', to: 'admin#index'
      post '/', to: 'admin#create'
      patch '/:id', to: 'admin#update'
      delete '/:id', to: 'admin#destroy'
    end
  end

  get "*path", to: "pages#index", constraints: lambda { |req|
    !req.path.start_with?("/rails/active_storage")  # Don't redirect Active Storage URLs
  }
end
