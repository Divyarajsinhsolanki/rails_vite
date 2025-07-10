class Api::QuotesController < Api::BaseController
  def index
    quotes = Quote.order(created_at: :desc)
    render json: quotes
  end

  def create
    quote = Quote.new(quote_params)
    if quote.save
      render json: quote, status: :created
    else
      render json: { errors: quote.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def quote_params
    params.require(:quote).permit(:content, :author)
  end
end
