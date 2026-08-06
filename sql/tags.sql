CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    category VARCHAR(20) NOT NULL -- e.g. 'customer', 'project_team', 'severity'
);

CREATE TABLE ticket_tags (
    ticket_id INT REFERENCES tickets(id),
    tag_id INT REFERENCES tags(id),
    PRIMARY KEY (ticket_id, tag_id)
);