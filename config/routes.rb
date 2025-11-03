Rails.application.routes.draw do
  devise_for :users, controllers: { confirmations: 'users/confirmations' }
  mount ActiveStorage::Engine => "/rails/active_storage"

  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  root "pages#index"

  # PDF
  post "/upload_pdf", to: "pdfs#upload_pdf"
  post "/reset_pdf", to: "pdfs#reset"
  get  "/download_pdf", to: "pdfs#download"

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

  # React now handles the /sheet route. Data is provided via the API below.

  namespace :api do
    post 'signup', to: 'auth#signup'
    post 'login', to: 'auth#login'
    delete 'logout', to: 'auth#logout'
    post   'refresh',       to: 'auth#refresh'
    get 'sprints/last', to: 'sprints#last'  
    get 'view_profile', to: 'auth#view_profile'
    post 'update_profile', to: 'auth#update_profile'
    get 'coding_tip', to: 'coding_tips#show'
    get 'dev_tool_of_the_day', to: 'dev_tools#show'
    get 'english_word', to: 'english_words#show'
    get 'english_tense', to: 'english_tenses#show'
    get 'english_phrase', to: 'english_phrases#show'
    get 'open_issue_spotlight', to: 'open_source_issues#show'
    get 'sheet', to: 'sheets#show'

    resources :users, only: [:index, :update, :destroy]
    resources :posts, only: [:index, :create, :update, :destroy] do
      resources :comments, only: [:index, :create, :destroy]
      member do
        post :like
        delete :unlike
      end
    end
    resources :sprints, only: [:index, :create, :update, :destroy] do
      member do
        post 'import_tasks'
        post 'export_tasks'
        post 'export_logs'
      end
    end
    resources :developers, only: [:index]
    resources :tasks, only: [:index, :create, :update, :destroy] do
      collection do
        post 'import_backlog'
      end
    end
    resources :teams, only: [:index, :create, :update, :destroy] do
      member do
        get :insights
      end
    end
    resources :team_users, only: [:create, :update, :destroy]
    delete 'team_users/leave/:team_id', to: 'team_users#leave'

    resources :skills, only: [:index]
    resources :user_skills, only: [:index, :create, :update, :destroy]
    resources :skill_endorsements, only: [:create, :destroy]
    resources :learning_goals, only: [:index, :create, :update, :destroy]
    resources :learning_checkpoints, only: [:create, :update, :destroy]

    resources :projects, only: [:index, :create, :update, :destroy]
    resources :project_users, only: [:create, :update, :destroy]
    delete 'project_users/leave/:project_id', to: 'project_users#leave'
    resources :task_logs, only: [:index, :create, :update, :destroy]

    resources :items, only: [:index, :create, :update, :destroy]

    resources :knowledge_bookmarks, only: [:index, :create, :update, :destroy] do
      member do
        post :mark_reviewed
      end
    end

    resources :roles, only: [:index]

    resources :work_categories, only: [:index, :create, :update, :destroy]
    resources :work_priorities, only: [:index, :create, :update, :destroy]
    resources :work_tags, only: [:index, :create, :update, :destroy]
    resources :work_logs, only: [:index, :create, :update, :destroy]
    resources :work_notes, only: [:index, :create, :update, :destroy]


    resources :contacts, only: [:create]


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
