# Filters, sorts and paginates the employee list from untrusted request params.
class EmployeesQuery
  DEFAULT_PER_PAGE = 25
  MAX_PER_PAGE = 100
  FILTERS = %i[country department job_title].freeze
  SORTS = {
    "name" => [ :last_name, :first_name ],
    "salary" => [ :salary ],
    "hire_date" => [ :hire_date ]
  }.freeze

  Result = Data.define(:records, :page, :per_page, :total) do
    def total_pages = (total.to_f / per_page).ceil
  end

  def initialize(params, scope: Employee.all)
    @params = params
    @scope = scope
  end

  def call
    relation = sorted(searched(filtered(@scope)))
    total = relation.count
    page = [ @params[:page].to_i, 1 ].max
    per_page = @params[:per_page].to_i.clamp(1, MAX_PER_PAGE)
    per_page = DEFAULT_PER_PAGE if @params[:per_page].blank?

    Result.new(relation.offset((page - 1) * per_page).limit(per_page).to_a, page, per_page, total)
  end

  private

  def filtered(relation)
    FILTERS.reduce(relation) do |rel, key|
      @params[key].present? ? rel.where(key => @params[key]) : rel
    end
  end

  def searched(relation)
    term = @params[:q].to_s.strip
    return relation if term.empty?

    pattern = "%#{Employee.sanitize_sql_like(term)}%"
    relation.where(
      "first_name || ' ' || last_name LIKE :p OR email LIKE :p OR job_title LIKE :p",
      p: pattern
    )
  end

  def sorted(relation)
    columns = SORTS.fetch(@params[:sort].to_s, SORTS["name"])
    direction = @params[:direction].to_s == "desc" ? :desc : :asc
    # id as tiebreaker keeps pagination stable when sort values repeat.
    relation.order(columns.to_h { |c| [ c, direction ] }.merge(id: direction))
  end
end
