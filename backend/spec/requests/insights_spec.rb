require "rails_helper"

RSpec.describe "Insights API", type: :request do
  def json = response.parsed_body

  before do
    create_employee(country: "India", job_title: "Engineer", salary: 30_000)
    create_employee(country: "India", job_title: "Manager", salary: 60_000)
    create_employee(country: "Germany", job_title: "Engineer", salary: 90_000)
  end

  it "GET /api/insights/summary returns org-wide numbers" do
    get "/api/insights/summary"

    expect(json).to eq(
      "headcount" => 3, "total_payroll" => 180_000, "average_salary" => 60_000, "median_salary" => 60_000
    )
  end

  it "GET /api/insights/summary can be scoped to a country" do
    get "/api/insights/summary", params: { country: "India" }

    expect(json).to include("headcount" => 2, "average_salary" => 45_000)
  end

  it "GET /api/insights/breakdown groups by job title within a country" do
    get "/api/insights/breakdown", params: { group_by: "job_title", country: "India" }

    expect(json.map { |row| row.slice("name", "average_salary") }).to eq([
      { "name" => "Manager", "average_salary" => 60_000 },
      { "name" => "Engineer", "average_salary" => 30_000 }
    ])
  end

  it "rejects an unsupported group_by" do
    get "/api/insights/breakdown", params: { group_by: "email" }

    expect(response).to have_http_status(:bad_request)
  end

  it "requires group_by" do
    get "/api/insights/breakdown"

    expect(response).to have_http_status(:bad_request)
  end
end
