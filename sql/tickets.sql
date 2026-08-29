CREATE TABLE tickets (
    id SERIAL PRIMARY KEY,
    project_id INT NOT NULL REFERENCES projects(id),
    user_id INT NOT NULL REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'open',
    assigned_to INT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP
);