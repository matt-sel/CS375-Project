-- Customer-related tags
INSERT INTO tags (name, category) VALUES
  ('customer-reported', 'customer'),
  ('vip-customer', 'customer'),
  ('customer-facing', 'customer');

-- Project team tags
INSERT INTO tags (name, category) VALUES
  ('frontend', 'project_team'),
  ('backend', 'project_team'),
  ('infra', 'project_team');

-- Severity tags
INSERT INTO tags (name, category) VALUES
  ('low', 'severity'),
  ('medium', 'severity'),
  ('high', 'severity'),
  ('critical', 'severity');