class DevelopersController < ApplicationController
  def index
    @developers = Developer.order(:name)
    render json: @developers
  end
end