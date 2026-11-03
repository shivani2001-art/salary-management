module Api
  class EmployeesController < ApplicationController
    PERMITTED = %i[first_name last_name email job_title department country salary hire_date].freeze

    def index
      result = EmployeesQuery.new(params.permit(:q, :sort, :direction, :page, :per_page, *EmployeesQuery::FILTERS)).call
      render json: {
        data: result.records,
        meta: { page: result.page, per_page: result.per_page, total: result.total, total_pages: result.total_pages }
      }
    end

    def show
      render json: employee
    end

    def create
      record = Employee.new(employee_params)
      if record.save
        render json: record, status: :created
      else
        render_errors(record)
      end
    end

    def update
      if employee.update(employee_params)
        render json: employee
      else
        render_errors(employee)
      end
    end

    def destroy
      employee.destroy!
      head :no_content
    end

    # Distinct values that exist in the data, used to populate filter dropdowns.
    def filter_options
      render json: EmployeesQuery::FILTERS.to_h { |col| [ col.to_s.pluralize, Employee.distinct.order(col).pluck(col) ] }
    end

    private

    def employee = @employee ||= Employee.find(params[:id])

    def employee_params = params.require(:employee).permit(*PERMITTED)

    def render_errors(record)
      render json: { errors: record.errors.to_hash(true) }, status: :unprocessable_content
    end
  end
end
