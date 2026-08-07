#!/bin/bash

USER="${1:-postgres}"
DATABASE="${2:-PublicTickets}"

echo "Resetting DB"

psql -U "$USER" -d "$DATABASE" -f sql/reset.sql

if [ $? -ne 0 ]; then 
    echo "Failed to reset DB"
    exit 1
fi

echo "DB reset complete"