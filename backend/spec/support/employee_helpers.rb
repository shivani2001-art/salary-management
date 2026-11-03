module EmployeeHelpers
  def employee_attributes(**overrides)
    @employee_sequence = (@employee_sequence || 0) + 1
    {
      first_name: "Ada",
      last_name: "Lovelace",
      email: "employee#{@employee_sequence}@acme.example",
      job_title: "Software Engineer",
      department: "Engineering",
      country: "United States",
      salary: 100_000,
      hire_date: Date.new(2020, 1, 15)
    }.merge(overrides)
  end

  def build_employee(**overrides) = Employee.new(employee_attributes(**overrides))
  def create_employee(**overrides) = Employee.create!(employee_attributes(**overrides))
end

RSpec.configure { |config| config.include EmployeeHelpers }
