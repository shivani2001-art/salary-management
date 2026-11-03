# Salary Management — Requirements (one page)

## Goal
Replace ACME's spreadsheet-based salary tracking with a web app that lets the **HR Manager** (1) keep salary
records for ~10,000 employees across many countries accurate, and (2) answer "how do we pay people?" questions
in seconds instead of building pivot tables.

## Users
One persona: the HR Manager. They are comfortable with spreadsheets, not with SQL. They need speed, filters, and
numbers they can trust.

## Questions the product must answer
1. How many people do we employ, and what is our total annual payroll?
2. What are the min / max / average / median salaries **in a given country**?
3. What is the average salary **for a given job title in a given country**? (e.g. "Software Engineer in India")
4. How does pay compare across departments?

## In scope (v1)
| Area | Feature | Why |
|---|---|---|
| Employees | Paginated list (10k rows) with search by name/email, filter by country / department / job title, sort by salary/name/hire date | Replaces scrolling an Excel sheet |
| Employees | Create, edit, delete an employee with server-side validation | Core "manage salaries" job |
| Insights | Org summary: headcount, total payroll, average salary | Q1 |
| Insights | Per-country stats: headcount, min, max, avg, median | Q2 |
| Insights | Per-job-title stats, filterable by country | Q3 |
| Insights | Per-department stats | Q4 |
| Data | Deterministic seed script for 10,000 employees | Realistic demo + performance check |
| Ops | Single Docker image (Rails API serves the built React app) | One-step deploy anywhere |

## Deliberately left out (and why)
| Left out | Reasoning |
|---|---|
| **Authentication / roles** | One persona, demo data. Adding auth is well understood (the next thing to add before real data) but adds no signal about the core problem. |
| **Multi-currency** | All salaries are stored as **annual gross in USD** (the org's reporting currency). Local-currency storage + FX rates is a real need but doubles the data model and needs an FX source of truth; deferred. |
| **Salary history / audit trail** | Valuable (raises, compliance) but a separate feature; v1 keeps current salary only. |
| **Excel import/export** | Natural migration path from spreadsheets; deferred until the data model settles. Seed script covers bulk loading for now. |
| **Payroll, tax, deductions, payslips** | Different product (payroll), not salary management. |
| **Charts library** | Tables with inline bars answer the questions; a charting dependency isn't worth it for v1. |
| **Bulk edit (e.g. "+5% for Engineering")** | Useful but risky without audit trail; comes after history. |

## Non-functional
- List and insight endpoints respond in < 200 ms on 10k rows (indexed SQLite, SQL aggregates, no N+1).
- Money stored as integer whole dollars — no floating-point drift.
- Fast, deterministic test suite (backend RSpec + frontend Vitest).

## Success criteria
The HR Manager can find any employee, change their salary, and answer Q1–Q4 without leaving the app.
