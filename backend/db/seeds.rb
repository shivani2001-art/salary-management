# Seeds 10,000 deterministic employees. Skips if data exists, so it's safe on every deploy.
# To wipe and reseed: bin/rails db:seed:replant
count = Integer(ENV.fetch("SEED_COUNT", 10_000))

if Employee.exists?
  puts "Employees already present (#{Employee.count}); skipping seed."
else
  started = Process.clock_gettime(Process::CLOCK_MONOTONIC)
  EmployeeSeeder.new(count:).call
  puts format("Seeded %d employees in %.2fs", count, Process.clock_gettime(Process::CLOCK_MONOTONIC) - started)
end
