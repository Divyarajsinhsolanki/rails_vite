class Api::TasksController < Api::BaseController
  before_action :set_task, only: [:update, :destroy]

  # GET /tasks.json
  def index
    @tasks = Task.includes(:assigned_user, :sprint)
                 .where('type != ? OR created_by = ?', 'general', current_user.id)
                 .order(end_date: :asc)

    @tasks = @tasks.where(assigned_to_user: params[:assigned_to_user]) if params[:assigned_to_user].present?
    @tasks = @tasks.where('sprint_id = ? OR type = ?', params[:sprint_id], 'general') if params[:sprint_id].present?
    @tasks = @tasks.where('project_id = ? OR type = ?', params[:project_id], 'general') if params[:project_id].present?
    @tasks = @tasks.where(type: params[:type]) if params[:type].present?

    render json: @tasks.as_json(include: {
      assigned_user: { only: [:id, :first_name, :email] },
      sprint: { only: [:id, :project_id] }
    })
  end

  # POST /tasks.json
  def create
    @task = Task.new(task_params)
    if @task.save
      render json: @task.as_json(include: {
        developer: {},
        assigned_user: { only: [:id, :first_name, :email] },
        sprint: { only: [:id, :project_id] }
      }), status: :created
    else
      render json: { errors: @task.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /tasks/:id.json
  def update
    old_sprint_id = @task.sprint_id
    old_dev_id    = @task.developer_id
    old_order     = @task.order

    permitted_params = task_params

    target_sprint_id = (permitted_params[:sprint_id].presence || old_sprint_id)
    target_dev_id    = (permitted_params[:developer_id].presence || old_dev_id)

    updated = with_order_locks([old_sprint_id, old_dev_id], [target_sprint_id, target_dev_id]) do
      success = Task.transaction do
        adjust_manual_order(@task, permitted_params)
        if @task.update(permitted_params)
          true
        else
          raise ActiveRecord::Rollback
        end
      end

      if success
        reorder_group(old_sprint_id, old_dev_id) if old_sprint_id && old_dev_id &&
          (old_sprint_id != @task.sprint_id || old_dev_id != @task.developer_id || old_order != @task.order)
        reorder_group(@task.sprint_id, @task.developer_id)
      end

      success
    end

    if updated
      render json: @task.as_json(include: {
        developer: {},
        assigned_user: { only: [:id, :first_name, :email] },
        sprint: { only: [:id, :project_id] }
      })
    else
      render json: { errors: @task.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /tasks/:id.json
  def destroy
    @task.destroy
    head :no_content
  end

  def import_backlog
    project = Project.find(params[:project_id]) if params[:project_id].present?
    service = TaskSheetService.new('Backlog', project&.sheet_id)
    service.import_tasks(sprint_id: nil, project_id: project&.id, created_by_id: current_user.id)
    head :no_content
  rescue StandardError => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  private

  def set_task
    @task = Task.where('type != ? OR created_by = ?', 'general', current_user.id).find(params[:id])
  end

  def task_params
    task_data = params.require(:task)
    task_data = task_data[:task] if task_data[:task].is_a?(ActionController::Parameters)

    permitted = task_data.permit(
      :task_id, :task_url, :type, :title, :description,
      :status, :order, :assigned_to_user,
      :created_by, :created_at, :updated_by, :updated_at,
      :start_date, :end_date,
      :estimated_hours, :sprint_id, :developer_id, :project_id, :is_struck,
      :qa_assigned, :internal_qa, :blocker, :demo, :swag_point, :story_point,
      :dev_hours, :code_review_hours, :dev_to_qa_hours, :qa_hours, :automation_qa_hours,
      :total_hours, :priority
    )

    # Tasks of type "general" should never be tied to a sprint or project.
    if permitted[:type] == 'general'
      permitted.delete(:sprint_id)
      permitted.delete(:project_id)
    end

    permitted
  end

  def adjust_manual_order(task, permitted)
    return unless permitted.key?(:order)

    raw_order = permitted[:order]
    return if raw_order.blank?

    target_sprint_id = (permitted[:sprint_id].presence || task.sprint_id).to_i
    target_dev_id    = (permitted[:developer_id].presence || task.developer_id).to_i

    return unless target_sprint_id == task.sprint_id && target_dev_id == task.developer_id

    desired_order = raw_order.to_i
    return if desired_order == task.order

    scope = Task.where(sprint_id: task.sprint_id, developer_id: task.developer_id)

    max_order = scope.count
    return if max_order.zero?

    desired_order = [[desired_order, 1].max, max_order].min

    # When the current task has no order yet, just set the desired value and let reorder_group normalize.
    if task.order.nil?
      permitted[:order] = desired_order
      return
    end

    if desired_order > task.order
      scope.where(order: (task.order + 1)..desired_order).update_all('"order" = "order" - 1')
    else
      scope.where(order: desired_order...task.order).update_all('"order" = "order" + 1')
    end

    permitted[:order] = desired_order
  end

  def reorder_group(sprint_id, developer_id)
    Task.transaction do
      tasks = Task.where(sprint_id: sprint_id, developer_id: developer_id)
                   .order(:order)
                   .order(updated_at: :desc)
                   .order(:id)
                   .lock

      tasks.each_with_index do |t, idx|
        new_order = idx + 1
        t.update_column(:order, new_order) if t.order != new_order
      end
    end
  end

  def with_order_locks(*pairs)
    locks = pairs.compact.map do |pair|
      sprint_id, developer_id = pair
      next unless sprint_id.present? && developer_id.present?
      [sprint_id.to_i, developer_id.to_i]
    end.compact.uniq.sort

    locks.each { |s_id, d_id| pg_advisory_lock(s_id, d_id) }
    yield
  ensure
    locks&.reverse_each { |s_id, d_id| pg_advisory_unlock(s_id, d_id) }
  end

  def pg_advisory_lock(sprint_id, developer_id)
    sql = ActiveRecord::Base.send(:sanitize_sql_array, ['SELECT pg_advisory_lock(?, ?)', sprint_id, developer_id])
    ActiveRecord::Base.connection.execute(sql)
  end

  def pg_advisory_unlock(sprint_id, developer_id)
    sql = ActiveRecord::Base.send(:sanitize_sql_array, ['SELECT pg_advisory_unlock(?, ?)', sprint_id, developer_id])
    ActiveRecord::Base.connection.execute(sql)
  end
end
