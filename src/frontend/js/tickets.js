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
    refreshTagOptions(tickets);
    ticketDiv.replaceChildren();
    errMessage.textContent = "";

    /* Looks unresponsive if we don't add a message in this case */
    if (tickets.length === 0) {
      errMessage.textContent = "No tickets found";
    }

    const filteredTickets = filterTickets(tickets);
    filteredTickets.forEach(tick => {
      const ticket = document.createElement("div");
      const title = document.createElement("h2");
      const createdBy = document.createElement("p");
      const description = document.createElement("p");
      const status = document.createElement("p");
      const timeCreated = document.createElement("p");

      const buttons = document.createElement("div");
      const commentButton = document.createElement("button");
      const upVoteButton = document.createElement("button");

      ticket.className = "ticket";
      title.className = "ticket-title";
      createdBy.className = "ticket-created-by";
      description.className = "ticket-description";
      timeCreated.className = "ticket-created";
      commentButton.className = "comment-button";
      upVoteButton.className = "upvote-button";

      let statusClass = "status-" + tick.status;
      if (!TICKET_STATUS_LABELS[tick.status]) {
        statusClass = "status-unknown";
      }
      status.className = "ticket-status " + statusClass;

      title.textContent = tick.title;
      createdBy.textContent = `Submitted by: ${tick.username}`;
      description.textContent = tick.description || "";
      status.textContent = TICKET_STATUS_LABELS[tick.status] || tick.status;
      timeCreated.textContent = `Created: ${tick.created_at}`;
      commentButton.textContent = "💬 TODO";
      upVoteButton.textContent = "▲ TODO";

      ticket.appendChild(title);
      ticket.appendChild(createdBy);
      ticket.appendChild(description);

      if (tick.tags[0]) {
        const tags = document.createElement("div");
        tags.className = "ticket-tags";
        tick.tags.forEach((tag) => {
          const pill = document.createElement("span");
          pill.className = "tag-pill";
          pill.textContent = tag;
          tags.appendChild(pill);
        });
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

      buttons.appendChild(commentButton);
      buttons.appendChild(upVoteButton);
      buttons.className = "ticket-buttons";

      ticket.append(buttons);
      ticketDiv.appendChild(ticket);
    });
  } catch (err) {
    errMessage.textContent = "Unable to get tickets";
  }
}

function filterTickets(tickets) {
  const sort = document.getElementById("sort").value;
  const status = document.getElementById("status-filter").value;
  const tag = document.getElementById("tag-filter").value;

  let newTickets = [...tickets];

  if (status !== "all") {
    newTickets = newTickets.filter(ticket => {
      return ticket.status === status;
    });
  }

  if (tag !== "all") {
    newTickets = newTickets.filter(ticket => {
      return ticket.tags.includes(tag);
    });
  }

  if (sort === "newest") {
    newTickets.sort((a,b) => {
      return new Date(b.created_at) - new Date(a.created_at);
    });
  }

  if (sort === "oldest") {
    newTickets.sort((a,b) => {
      return new Date(a.created_at) - new Date(b.created_at);
    });
  }

  return newTickets;
}

function refreshTagOptions(tickets) {
  const tagFilter = document.getElementById("tag-filter");
  const currentFilter = tagFilter.value;
  tagFilter.replaceChildren();

  const options = document.createElement("option");
  options.value = "all";
  options.textContent = "All";
  tagFilter.appendChild(options);

  const tags = [];

  tickets.forEach(ticket => {
    ticket.tags.forEach(tag => {
      if (tag && !tags.includes(tag)) {
        tags.push(tag);
      }
    });
  });
  tags.sort();

  tags.forEach(tag => {
    const option = document.createElement("option");
    option.value = tag;
    option.textContent = tag;
    tagFilter.appendChild(option);
  });

  tagFilter.value = currentFilter;
}

getTickets();
setInterval(getTickets, 5000);

document.getElementById("sort").addEventListener("change", getTickets);
document.getElementById("status-filter").addEventListener("change", getTickets);
document.getElementById("tag-filter").addEventListener("change", getTickets);