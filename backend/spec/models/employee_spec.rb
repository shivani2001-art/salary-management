require "rails_helper"

RSpec.describe Employee do
  it "is valid with complete attributes" do
    expect(build_employee).to be_valid
  end

  %i[first_name last_name email job_title department country salary hire_date].each do |attr|
    it "requires #{attr}" do
      employee = build_employee(attr => nil)
      expect(employee).not_to be_valid
      expect(employee.errors[attr]).to be_present
    end
  end

  describe "email" do
    it "is normalized to lowercase without surrounding whitespace" do
      expect(build_employee(email: "  Ada@ACME.Example ").email).to eq("ada@acme.example")
    end

    it "must be unique regardless of case" do
      create_employee(email: "ada@acme.example")
      duplicate = build_employee(email: "ADA@acme.example")

      expect(duplicate).not_to be_valid
      expect(duplicate.errors[:email]).to include("has already been taken")
    end

    it "must look like an email" do
      expect(build_employee(email: "not-an-email")).not_to be_valid
    end
  end

  describe "salary" do
    it "must be a positive whole number" do
      expect(build_employee(salary: 0)).not_to be_valid
      expect(build_employee(salary: -5)).not_to be_valid
      expect(build_employee(salary: 1_000.50)).not_to be_valid
    end

    it "is capped to catch typos like extra zeros" do
      expect(build_employee(salary: Employee::MAX_SALARY)).to be_valid
      expect(build_employee(salary: Employee::MAX_SALARY + 1)).not_to be_valid
    end
  end

  it "rejects a hire date in the future" do
    employee = build_employee(hire_date: Date.tomorrow)

    expect(employee).not_to be_valid
    expect(employee.errors[:hire_date]).to include("can't be in the future")
  end

  it "squishes whitespace in text fields" do
    expect(build_employee(job_title: "  Software   Engineer ").job_title).to eq("Software Engineer")
  end
end
