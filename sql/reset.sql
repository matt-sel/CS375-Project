DROP TABLE IF EXISTS ticket_tags;
DROP TABLE IF EXISTS votes;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS tags;
DROP TABLE IF EXISTS tickets;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS companies;

\i sql/companies.sql
\i sql/users.sql
\i sql/tickets.sql
\i sql/tags.sql
\i sql/comments.sql
\i sql/votes.sql