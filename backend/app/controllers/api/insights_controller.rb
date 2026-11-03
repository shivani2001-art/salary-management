module Api
  class InsightsController < ApplicationController
    def summary
      render json: SalaryStats.new(scope).summary
    end

    def breakdown
      group_by = params.require(:group_by)
      return render json: { error: "group_by must be one of #{SalaryStats::GROUPABLE.join(', ')}" }, status: :bad_request unless SalaryStats::GROUPABLE.include?(group_by)

      render json: SalaryStats.new(scope).breakdown(group_by)
    end

    private

    # Same filters as the employee list, so "Engineers in India" works everywhere.
    def scope = Employee.where(params.slice(*EmployeesQuery::FILTERS).permit(*EmployeesQuery::FILTERS).compact_blank)
  end
end
