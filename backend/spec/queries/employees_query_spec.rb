require "rails_helper"

RSpec.describe EmployeesQuery do
  def names(result) = result.records.map { |e| "#{e.first_name} #{e.last_name}" }

  let!(:ada) { create_employee(first_name: "Ada", last_name: "Lovelace", country: "United Kingdom", salary: 90_000) }
  let!(:alan) { create_employee(first_name: "Alan", last_name: "Turing", country: "United Kingdom", department: "Research", salary: 120_000) }
  let!(:grace) { create_employee(first_name: "Grace", last_name: "Hopper", country: "United States", job_title: "Admiral", salary: 150_000) }

  it "returns everyone sorted by last name by default" do
    expect(names(described_class.new({}).call)).to eq([ "Grace Hopper", "Ada Lovelace", "Alan Turing" ])
  end

  it "filters by country, department and job title" do
    expect(names(described_class.new({ country: "United Kingdom" }).call)).to eq([ "Ada Lovelace", "Alan Turing" ])
    expect(names(described_class.new({ department: "Research" }).call)).to eq([ "Alan Turing" ])
    expect(names(described_class.new({ job_title: "Admiral" }).call)).to eq([ "Grace Hopper" ])
  end

  it "searches full name, email and job title case-insensitively" do
    expect(names(described_class.new({ q: "ada love" }).call)).to eq([ "Ada Lovelace" ])
    expect(names(described_class.new({ q: grace.email.upcase }).call)).to eq([ "Grace Hopper" ])
    expect(names(described_class.new({ q: "admir" }).call)).to eq([ "Grace Hopper" ])
  end

  it "treats LIKE wildcards in the search term literally" do
    expect(described_class.new({ q: "%" }).call.total).to eq(0)
  end

  it "sorts by salary in either direction and ignores unknown sort keys" do
    expect(names(described_class.new({ sort: "salary", direction: "desc" }).call).first).to eq("Grace Hopper")
    expect(names(described_class.new({ sort: "salary" }).call).first).to eq("Ada Lovelace")
    expect(names(described_class.new({ sort: "password" }).call).first).to eq("Grace Hopper")
  end

  it "paginates and reports totals" do
    result = described_class.new({ page: 2, per_page: 2 }).call

    expect(names(result)).to eq([ "Alan Turing" ])
    expect([ result.page, result.per_page, result.total, result.total_pages ]).to eq([ 2, 2, 3, 2 ])
  end

  it "clamps nonsense pagination params" do
    result = described_class.new({ page: -3, per_page: 10_000 }).call

    expect([ result.page, result.per_page ]).to eq([ 1, EmployeesQuery::MAX_PER_PAGE ])
  end
end
