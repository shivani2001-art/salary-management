require "rails_helper"

RSpec.describe EmployeeSeeder do
  it "inserts the requested number of employees" do
    expect { described_class.new(count: 1_500).call }.to change(Employee, :count).by(1_500)
  end

  it "produces rows that pass model validations" do
    described_class.new(count: 200).call

    expect(Employee.all.reject(&:valid?)).to be_empty
  end

  it "is deterministic for the same random seed" do
    described_class.new(count: 50, random: Random.new(7)).call
    first_run = Employee.order(:id).pluck(:email, :salary, :country)
    Employee.delete_all

    described_class.new(count: 50, random: Random.new(7)).call

    expect(Employee.order(:id).pluck(:email, :salary, :country)).to eq(first_run)
  end

  it "pays the same role less in a lower-cost country" do
    described_class.new(count: 2_000).call
    stats = SalaryStats.new(Employee.where(job_title: "Software Engineer")).breakdown(:country).index_by { |r| r[:name] }

    expect(stats["India"][:average_salary]).to be < stats["United States"][:average_salary]
  end
end
