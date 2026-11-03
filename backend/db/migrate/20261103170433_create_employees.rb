class CreateEmployees < ActiveRecord::Migration[8.1]
  def change
    create_table :employees do |t|
      t.string :first_name, null: false
      t.string :last_name, null: false
      t.string :email, null: false
      t.string :job_title, null: false
      t.string :department, null: false
      t.string :country, null: false
      # Annual gross salary in whole USD (integer avoids float drift).
      t.integer :salary, null: false
      t.date :hire_date, null: false

      t.timestamps
    end

    add_index :employees, :email, unique: true
    add_index :employees, [ :country, :job_title ]
    add_index :employees, :department
    add_index :employees, [ :last_name, :first_name ]
    add_check_constraint :employees, "salary > 0", name: "salary_positive"
  end
end
