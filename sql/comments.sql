CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    ticket_id INT REFERENCES tickets(id),
    user_id INT REFERENCES users(id),
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);