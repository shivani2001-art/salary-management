Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    resources :employees, only: %i[index show create update destroy] do
      get :filter_options, on: :collection
    end
    get "insights/summary", to: "insights#summary"
    get "insights/breakdown", to: "insights#breakdown"
  end
end
