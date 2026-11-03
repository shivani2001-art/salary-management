# Answers "how do we pay people?" with SQL aggregates over any Employee scope.
class SalaryStats
  GROUPABLE = %w[country department job_title].freeze

  def initialize(scope = Employee.all)
    @scope = scope
  end

  def summary
    headcount, total, average = @scope.pick(
      Arel.sql("COUNT(*)"), Arel.sql("COALESCE(SUM(salary), 0)"), Arel.sql("AVG(salary)")
    )
    {
      headcount: headcount,
      total_payroll: total,
      average_salary: average&.round,
      median_salary: median
    }
  end

  # One row per distinct value of +column+, highest average salary first.
  def breakdown(column)
    column = column.to_s
    raise ArgumentError, "cannot group by #{column.inspect}" unless GROUPABLE.include?(column)

    medians = medians_by(column)
    @scope.group(column)
          .order(Arel.sql("AVG(salary) DESC"), column)
          .pluck(column, *%w[COUNT(*) MIN(salary) MAX(salary) AVG(salary)].map { |sql| Arel.sql(sql) })
          .map do |name, headcount, min, max, average|
            { name:, headcount:, min_salary: min, max_salary: max,
              average_salary: average.round, median_salary: medians[name] }
          end
  end

  private

  def median
    count = @scope.count
    return nil if count.zero?

    # Odd count -> the middle value; even count -> mean of the two middle values.
    middle = @scope.order(:salary).offset((count - 1) / 2).limit(count.odd? ? 1 : 2).pluck(:salary)
    (middle.sum / middle.size.to_f).round
  end

  # Window functions compute every group's median in one query instead of one per group.
  # +column+ is safe to interpolate: callers check it against GROUPABLE.
  def medians_by(column)
    sql = <<~SQL
      SELECT grp, AVG(salary) FROM (
        SELECT #{column} AS grp, salary,
               ROW_NUMBER() OVER (PARTITION BY #{column} ORDER BY salary) AS rn,
               COUNT(*) OVER (PARTITION BY #{column}) AS cnt
        FROM (#{@scope.select(column, :salary).to_sql})
      )
      WHERE rn IN ((cnt + 1) / 2, (cnt + 2) / 2)
      GROUP BY grp
    SQL
    Employee.connection.select_rows(sql).to_h { |name, value| [ name, value.round ] }
  end
end
