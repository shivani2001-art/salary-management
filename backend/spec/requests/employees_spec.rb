require "rails_helper"

RSpec.describe "Employees API", type: :request do
  def json = response.parsed_body

  describe "GET /api/employees" do
    it "returns a page of employees with pagination meta" do
      3.times { create_employee }

      get "/api/employees", params: { per_page: 2 }

      expect(response).to have_http_status(:ok)
      expect(json["data"].size).to eq(2)
      expect(json["meta"]).to eq("page" => 1, "per_page" => 2, "total" => 3, "total_pages" => 2)
    end

    it "applies filters from the query string" do
      create_employee(country: "India")
      create_employee(country: "Germany")

      get "/api/employees", params: { country: "India" }

      expect(json["data"].map { |e| e["country"] }).to eq([ "India" ])
    end

    it "ignores non-scalar filter values instead of erroring" do
      create_employee

      get "/api/employees", params: { country: { evil: "1" } }

      expect(response).to have_http_status(:ok)
      expect(json["meta"]["total"]).to eq(1)
    end
  end

  describe "GET /api/employees/:id" do
    it "returns the employee" do
      employee = create_employee(first_name: "Grace")

      get "/api/employees/#{employee.id}"

      expect(json).to include("id" => employee.id, "first_name" => "Grace", "salary" => 100_000)
    end

    it "returns 404 for an unknown id" do
      get "/api/employees/999999"

      expect(response).to have_http_status(:not_found)
    end
  end

  describe "POST /api/employees" do
    it "creates an employee" do
      expect {
        post "/api/employees", params: { employee: employee_attributes(email: "new@acme.example") }
      }.to change(Employee, :count).by(1)

      expect(response).to have_http_status(:created)
      expect(json["email"]).to eq("new@acme.example")
    end

    it "returns field errors for invalid input" do
      post "/api/employees", params: { employee: employee_attributes(salary: -1, email: "") }

      expect(response).to have_http_status(:unprocessable_content)
      expect(json["errors"].keys).to contain_exactly("salary", "email")
    end

    it "returns 400 when the employee payload is missing" do
      post "/api/employees", params: {}

      expect(response).to have_http_status(:bad_request)
    end
  end

  describe "PATCH /api/employees/:id" do
    it "updates the salary" do
      employee = create_employee(salary: 100_000)

      patch "/api/employees/#{employee.id}", params: { employee: { salary: 110_000 } }

      expect(response).to have_http_status(:ok)
      expect(employee.reload.salary).to eq(110_000)
    end

    it "does not persist invalid changes" do
      employee = create_employee(salary: 100_000)

      patch "/api/employees/#{employee.id}", params: { employee: { salary: 0 } }

      expect(response).to have_http_status(:unprocessable_content)
      expect(employee.reload.salary).to eq(100_000)
    end
  end

  describe "DELETE /api/employees/:id" do
    it "deletes the employee" do
      employee = create_employee

      expect { delete "/api/employees/#{employee.id}" }.to change(Employee, :count).by(-1)
      expect(response).to have_http_status(:no_content)
    end
  end

  describe "GET /api/employees/filter_options" do
    it "lists the distinct values present in the data" do
      create_employee(country: "India", department: "Sales", job_title: "AE")
      create_employee(country: "Brazil", department: "Sales", job_title: "SDR")

      get "/api/employees/filter_options"

      expect(json).to eq(
        "countries" => [ "Brazil", "India" ],
        "departments" => [ "Sales" ],
        "job_titles" => [ "AE", "SDR" ]
      )
    end
  end
end
