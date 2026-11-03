require "rails_helper"

RSpec.describe SalaryStats do
  describe "#summary" do
    it "returns zeros and nils for an empty org" do
      expect(described_class.new.summary).to eq(
        headcount: 0, total_payroll: 0, average_salary: nil, median_salary: nil
      )
    end

    it "computes headcount, payroll, average and median (odd count)" do
      [ 50_000, 70_000, 120_000 ].each { |salary| create_employee(salary:) }

      expect(described_class.new.summary).to eq(
        headcount: 3, total_payroll: 240_000, average_salary: 80_000, median_salary: 70_000
      )
    end

    it "uses the mean of the two middle values for an even count" do
      [ 10, 20, 30, 1_000 ].each { |salary| create_employee(salary:) }

      expect(described_class.new.summary[:median_salary]).to eq(25)
    end

    it "only considers the given scope" do
      create_employee(country: "India", salary: 30_000)
      create_employee(country: "Germany", salary: 90_000)

      summary = described_class.new(Employee.where(country: "India")).summary

      expect(summary).to include(headcount: 1, total_payroll: 30_000)
    end
  end

  describe "#breakdown" do
    before do
      create_employee(country: "India", job_title: "Engineer", salary: 20_000)
      create_employee(country: "India", job_title: "Engineer", salary: 40_000)
      create_employee(country: "India", job_title: "Manager", salary: 90_000)
      create_employee(country: "Germany", job_title: "Engineer", salary: 80_000)
    end

    it "returns per-group stats ordered by average salary, highest first" do
      expect(described_class.new.breakdown(:country)).to eq([
        { name: "Germany", headcount: 1, min_salary: 80_000, max_salary: 80_000,
          average_salary: 80_000, median_salary: 80_000 },
        { name: "India", headcount: 3, min_salary: 20_000, max_salary: 90_000,
          average_salary: 50_000, median_salary: 40_000 }
      ])
    end

    it "answers 'average salary for a job title in a country'" do
      rows = described_class.new(Employee.where(country: "India")).breakdown("job_title")

      expect(rows.map { |r| r.values_at(:name, :average_salary, :median_salary) })
        .to eq([ [ "Manager", 90_000, 90_000 ], [ "Engineer", 30_000, 30_000 ] ])
    end

    it "rejects columns outside the allow-list" do
      expect { described_class.new.breakdown("salary; DROP TABLE employees") }
        .to raise_error(ArgumentError)
    end
  end
end
