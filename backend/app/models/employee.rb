class Employee < ApplicationRecord
  MAX_SALARY = 10_000_000

  normalizes :email, with: ->(email) { email.strip.downcase }
  normalizes :first_name, :last_name, :job_title, :department, :country, with: ->(value) { value.squish }

  validates :first_name, :last_name, :job_title, :department, :country, presence: true, length: { maximum: 100 }
  validates :email, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :salary, numericality: { only_integer: true, greater_than: 0, less_than_or_equal_to: MAX_SALARY }
  validates :hire_date, presence: true
  validate :hire_date_not_in_future

  private

  def hire_date_not_in_future
    errors.add(:hire_date, "can't be in the future") if hire_date&.future?
  end
end
