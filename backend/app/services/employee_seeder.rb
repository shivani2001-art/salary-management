# Generates realistic, reproducible employee data. Same seed => same rows.
class EmployeeSeeder
  REFERENCE_DATE = Date.new(2026, 1, 1)
  BATCH_SIZE = 1_000

  # Country => [weight (share of headcount), pay multiplier vs. US]
  COUNTRIES = {
    "United States" => [ 30, 1.00 ], "India" => [ 20, 0.28 ], "United Kingdom" => [ 10, 0.80 ],
    "Germany" => [ 8, 0.85 ], "Canada" => [ 7, 0.80 ], "Brazil" => [ 6, 0.32 ],
    "Australia" => [ 5, 0.85 ], "Singapore" => [ 5, 0.90 ], "Japan" => [ 5, 0.70 ], "Mexico" => [ 4, 0.30 ]
  }.freeze

  # Department => { job title => US base salary }
  ROLES = {
    "Engineering" => { "Software Engineer" => 125_000, "Senior Software Engineer" => 165_000,
                       "Engineering Manager" => 195_000, "QA Engineer" => 95_000, "DevOps Engineer" => 135_000 },
    "Product" => { "Product Manager" => 145_000, "Product Designer" => 115_000 },
    "Sales" => { "Sales Development Rep" => 60_000, "Account Executive" => 95_000, "Sales Manager" => 135_000 },
    "Marketing" => { "Marketing Specialist" => 75_000, "Marketing Manager" => 120_000 },
    "Finance" => { "Accountant" => 75_000, "Financial Analyst" => 92_000 },
    "People" => { "HR Generalist" => 70_000, "HR Manager" => 105_000 },
    "Customer Support" => { "Support Specialist" => 50_000, "Support Lead" => 72_000 }
  }.freeze

  FIRST_NAMES = %w[
    James Mary Aarav Priya Liam Emma Noah Olivia Lucas Sofia Mateo Isabella Hiroshi Yuki Wei Mei Arjun Ananya
    Oliver Charlotte Ethan Amelia Lukas Hannah Gabriel Ana Diego Valentina Rahul Sneha Kenji Sakura Daniel Chloe
    Jacob Ava Mohammed Fatima Leon Mia
  ].freeze
  LAST_NAMES = %w[
    Smith Johnson Patel Sharma Garcia Martinez Müller Schmidt Tanaka Suzuki Chen Wang Silva Santos Brown Wilson
    Taylor Anderson Kumar Singh Rossi Nguyen Kim Lee Lopez Gonzalez Williams Jones Davis Miller Thomas Moore
    Jackson White Harris Clark Lewis Walker Hall Young
  ].freeze

  ROLE_LIST = ROLES.flat_map { |dept, titles| titles.map { |title, base| [ dept, title, base ] } }.freeze
  COUNTRY_LIST = COUNTRIES.flat_map { |name, (weight, _)| [ name ] * weight }.freeze

  def initialize(count:, random: Random.new(42))
    @count = count
    @random = random
  end

  def call
    now = Time.current
    1.upto(@count).each_slice(BATCH_SIZE) do |indexes|
      Employee.insert_all!(indexes.map { |i| row(i).merge(created_at: now, updated_at: now) })
    end
    @count
  end

  private

  def row(index)
    first = FIRST_NAMES.sample(random: @random)
    last = LAST_NAMES.sample(random: @random)
    department, job_title, base = ROLE_LIST.sample(random: @random)
    country = COUNTRY_LIST.sample(random: @random)
    {
      first_name: first,
      last_name: last,
      # Index suffix guarantees uniqueness across 10k rows built from 40x40 names.
      email: "#{first}.#{last}.#{index}@acme.example".downcase.unicode_normalize(:nfkd).gsub(/[^\x00-\x7F]/, ""),
      department:,
      job_title:,
      country:,
      salary: salary_for(base, country),
      hire_date: REFERENCE_DATE - @random.rand(1..(15 * 365))
    }
  end

  # +/-20% spread around the country-adjusted base, rounded to the nearest 500.
  def salary_for(base, country)
    multiplier = COUNTRIES.fetch(country).last
    ((base * multiplier * @random.rand(0.8..1.2)) / 500).round * 500
  end
end
