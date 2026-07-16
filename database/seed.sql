USE societyhub;

INSERT INTO users (name, email, phone, flat_no, password, role) VALUES
  ('Admin One', 'admin1@societyhub.com', '9000000001', 'A101', '$2b$10$gSUR0RVoTbFgXwpLqEl1SOo0.7nZywhGGAvYe1/fRsdDzdY83GZB6', 'admin'),
  ('Admin Two', 'admin2@societyhub.com', '9000000002', 'A102', '$2b$10$gSUR0RVoTbFgXwpLqEl1SOo0.7nZywhGGAvYe1/fRsdDzdY83GZB6', 'admin'),
  ('Admin Three', 'admin3@societyhub.com', '9000000003', 'A103', '$2b$10$gSUR0RVoTbFgXwpLqEl1SOo0.7nZywhGGAvYe1/fRsdDzdY83GZB6', 'admin'),
  ('Member One', 'member1@societyhub.com', '9000000011', 'B201', '$2b$10$yO7UH/hcjNFhss7A9GuJX.Lsy1NepF6aCoKzQLWrLebdP5we/LFsy', 'member');

INSERT INTO workers (name, phone, type, salary) VALUES
  ('Ramesh Patel', '9000000101', 'Security', 15000),
  ('Suresh Kumar', '9000000102', 'Gardener', 12000),
  ('Anita Joshi', '9000000103', 'Cleaner', 10000);

INSERT INTO attendance (worker_id, date, status) VALUES
  (1, '2026-07-01', 'Present'),
  (2, '2026-07-01', 'Absent'),
  (3, '2026-07-01', 'Present');

INSERT INTO expenses (category, expense_date, amount, description) VALUES
  ('Security Salary', '2026-07-02', 45000.00, 'Monthly security salary'),
  ('Garden Maintenance', '2026-07-03', 1200.00, 'Flower bed trimming');

INSERT INTO expense_proofs (expense_id, filename) VALUES
  (1, 'security_salary_2026-07-02.jpg'),
  (2, 'garden_maintenance_2026-07-03.jpg');

INSERT INTO maintenance (member_id, month_year, amount, status, paid_date) VALUES
  (4, '2026-07', 2500.00, 'Paid', '2026-07-05 10:00:00');
