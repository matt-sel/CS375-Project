# Public Tickets

## Description

Develop a Jira like ticket managing platform that allows you to create, comment, upvote, and tag tickets. There is also an administrative page that shows telemetry about your tickets and projects.

## Getting Started

1. Make sure that you have psql installed and running.

2. Setup your env.json inside of `src/`

```json
{
    "user": "",
    "host": "",
    "database": "",
    "password": "",
    "port": ,
    "session_secret": ""
}
```

3. Install the required npm packages, i.e. `npm install` in the same dir as the `src/backend/package.json`