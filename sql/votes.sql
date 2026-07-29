CREATE TABLE votes (
    ticket_id INT REFERENCES tickets(id),
    user_id INT REFERENCES users(id),
    PRIMARY KEY (ticket_id, user_id)
)