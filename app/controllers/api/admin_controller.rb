class Api::AdminController < ApplicationController
  before_action :set_model, except: [:tables]
  
  def tables
    Rails.application.eager_load!
  
    not_needed_tables = %w[
      ApplicationRecord
      ActiveStorage::Blob
      ActiveStorage::Attachment
      ActiveStorage::VariantRecord
      ActionText::RichText
      ActionText::EncryptedRichText
      ActionMailbox::InboundEmail
      ActionMailbox::Record
      ActiveStorage::Record
      ActionText::Record
    ]
  
    models = ActiveRecord::Base.descendants.map(&:name).uniq - not_needed_tables
  
    render json: models
  end

  def meta
    columns = @model.columns.map do |c|
      {
        name: c.name,
        type: c.type,
        null: c.null,
        default: c.default
      }
    end
    render json: columns
  end

  def index
    records = @model.order(id: :desc).limit(100)
  
    json = records.map do |record|
      data = record.serializable_hash(except: [:image])
  
      if record.respond_to?(:image) && record.image.attached?
        data[:image_url] = url_for(record.image)
      end
  
      data
    end
  
    render json: json
  end

  def create
    record = @model.new(record_params)
    record.save!
    render json: serialize_record(record)
  end
  
  def update
    record = @model.find(params[:id])
    record.update!(record_params)
    render json: serialize_record(record)
  end

  def destroy
    record = @model.find(params[:id])
    record.destroy!
    render json: { success: true }
  end

  private

  def serialize_record(record)
    data = record.serializable_hash(except: [:image])
  
    if record.respond_to?(:image) && record.image.attached?
      data[:image_url] = url_for(record.image)
    end
  
    data
  end

  def set_model
    @model = params[:table].classify.constantize
  rescue
    render json: { error: "Invalid table name" }, status: :unprocessable_entity
  end

  def record_params
    params.require(:record).permit(@model.column_names.map(&:to_sym))
  end
end
