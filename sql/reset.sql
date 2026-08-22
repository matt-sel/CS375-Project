DROP TABLE IF EXISTS ticket_tags;
DROP TABLE IF EXISTS votes;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS tags;
DROP TABLE IF EXISTS tickets;
DROP TABLE IF EXISTS project_members;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS users;

\i sql/users.sql
\i sql/projects.sql
\i sql/project_members.sql
\i sql/tickets.sql
\i sql/tags.sql
\i sql/comments.sql
\i sql/votes.sql