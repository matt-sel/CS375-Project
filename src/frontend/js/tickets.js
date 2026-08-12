const TICKET_STATUSES = {
  OPEN: "open",
  PENDING: "pending",
  CLOSED: "closed"
}

async function getTickets() {
  const ticketDiv = document.getElementById("tickets");
  const errMessage = document.getElementById("tickets-error");
  try {
    const res = await fetch("/api/tickets");

    if (!res.ok) {
      const data = await res.json();
      errMessage.textContent = data.error;
      return;
    }

    const tickets = await res.json();
    ticketDiv.replaceChildren();
    errMessage.textContent = "";

    /* Looks unresponsive if we don't add a message in this case */
    if (tickets.length === 0) {
      errMessage.textContent = "No tickets found";
    }

    tickets.forEach(tick => {
      const ticket = document.createElement("div");
      const title = document.createElement("h2");
      const createdBy = document.createElement("p");
      const description = document.createElement("p");
      const status = document.createElement("p");
      const timeCreated = document.createElement("p");

      ticket.className = "ticket";
      title.className = "ticket-title";
      createdBy.className = "ticket-created-by";
      description.className = "ticket-description";
      timeCreated.className = "ticket-created";
      let statusClass = "status-" + tick.status;
      if (tick.status === TICKET_STATUSES.OPEN) {
        statusClass = "status-open";
      } else if (tick.status === TICKET_STATUSES.PENDING) {
        statusClass = "status-pending";
      } else if (tick.status === TICKET_STATUSES.CLOSED) {
        statusClass = "status-closed";
      } else {
        statusClass = "status-unknown";
      }
      status.className = "ticket-status " + statusClass;


      title.textContent = tick.title;
      createdBy.textContent = `Submitted by: ${tick.username}`;
      description.textContent = tick.description || "";
      status.textContent = tick.status;
      timeCreated.textContent = `Created: ${tick.created_at}`;

      ticket.appendChild(title);
      ticket.appendChild(createdBy);
      ticket.appendChild(description);

      /*TODO: Revisit this so that we can nicely color the tags in pill form like the status */
      if (tick.tags[0]) {
        const tags = document.createElement("p");
        tags.className = "ticket-tags";
        tags.textContent = "Tags: " + tick.tags.join(", ");
        ticket.append(tags);
      }

      ticket.appendChild(status);
      ticket.appendChild(timeCreated);

      if (tick.closed_at) {
        const timeClosed = document.createElement("p");
        timeClosed.className = "ticket-created";
        timeClosed.textContent = `Closed: ${tick.closed_at}`;
        ticket.appendChild(timeClosed);
      }

      ticketDiv.appendChild(ticket);
    });
  } catch (err) {
    errMessage.textContent = "Unable to get tickets";
  }
}

getTickets();
setInterval(getTickets, 5000);