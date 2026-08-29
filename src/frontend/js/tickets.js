let projectMembers = [];

async function loadProjectMembers(projectId) {
  if (!projectId) {
    projectMembers = [];
    return;
  }
  try {
    const res = await fetch(`/api/projects/${projectId}/members`);
    if (!res.ok) {
      projectMembers = [];
      return;
    }
    projectMembers = await res.json();
  } catch (err) {
    projectMembers = [];
  }
}

async function loadComments(ticketId, panel) {
  panel.innerHTML = "Loading comments...";
  try {
    const res = await fetch(`/api/tickets/${ticketId}/comments`);
    const comments = await res.json();
    if (!res.ok) {
      panel.textContent = comments.error;
      return;
    }

    panel.innerHTML = "";
    const list = document.createElement("div");
    list.className = "comment-list";

    if (comments.length === 0) {
      const empty = document.createElement("p");
      empty.className = "comment-empty";
      empty.textContent = "No comments yet.";
      list.appendChild(empty);
    }

    comments.forEach((c) => {
      const item = document.createElement("div");
      item.className = "comment-item";
      const author = document.createElement("strong");
      author.textContent = c.username;
      const body = document.createElement("p");
      body.textContent = c.comment;
      item.appendChild(author);
      item.appendChild(body);
      list.appendChild(item);
    });
    panel.appendChild(list);

    const form = document.createElement("div");
    form.className = "comment-form";
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Add a comment...";
    const submit = document.createElement("button");
    submit.type = "button";
    submit.textContent = "Post";

    submit.addEventListener("click", async () => {
      const value = input.value.trim();
      if (!value) {
        return;
      }
      const res = await fetch(`/api/tickets/${ticketId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: value })
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error);
        return;
      }
      input.value = "";
      await loadComments(ticketId, panel);
    });

    form.appendChild(input);
    form.appendChild(submit);
    panel.appendChild(form);
  } catch (err) {
    panel.textContent = "Unable to load comments";
  }
}

function showTagEditor(ticketId, currentTags, container, onSave) {
  let workingTags = [...currentTags];
  container.innerHTML = "";

  const pillsRow = document.createElement("div");
  pillsRow.className = "tag-edit-pills";

  function renderWorkingPills() {
    pillsRow.innerHTML = "";
    workingTags.forEach((tag, index) => {
      const pill = document.createElement("span");
      pill.className = "tag-pill";
      const label = document.createElement("span");
      label.textContent = tag;
      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.textContent = "×";
      removeButton.addEventListener("click", () => {
        workingTags.splice(index, 1);
        renderWorkingPills();
      });
      pill.appendChild(label);
      pill.appendChild(removeButton);
      pillsRow.appendChild(pill);
    });
  }
  renderWorkingPills();

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Add a tag...";

  const addButton = document.createElement("button");
  addButton.type = "button";
  addButton.textContent = "Add";
  addButton.addEventListener("click", () => {
    const value = input.value.trim();
    if (value && !workingTags.includes(value)) {
      workingTags.push(value);
      input.value = "";
      renderWorkingPills();
    }
  });

  const saveButton = document.createElement("button");
  saveButton.type = "button";
  saveButton.textContent = "Save";
  saveButton.addEventListener("click", async () => {
    const res = await fetch(`/api/tickets/${ticketId}/tags`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tags: workingTags })
    });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error);
      return;
    }
    onSave(workingTags);
  });

  const cancelButton = document.createElement("button");
  cancelButton.type = "button";
  cancelButton.textContent = "Cancel";
  cancelButton.addEventListener("click", () => {
    onSave(currentTags);
  });

  const row = document.createElement("div");
  row.className = "tag-edit-row";
  row.appendChild(input);
  row.appendChild(addButton);
  row.appendChild(saveButton);
  row.appendChild(cancelButton);

  container.appendChild(pillsRow);
  container.appendChild(row);
}

async function getProjects() {
  const projectSelect = document.getElementById("project-select");

  try {
    const res = await fetch("/api/projects");
    if (!res.ok) {
      if (res.status === 401) {
        // Differentiate from no tickets
        document.getElementById("tickets-error").textContent =
          "Please log in to view tickets.";
      }
      return;
    }

    const projects = await res.json();
    const currentValue = projectSelect.value;
    projectSelect.replaceChildren();

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Select a project";
    projectSelect.appendChild(defaultOption);

    projects.forEach((project) => {
      const option = document.createElement("option");
      option.value = project.id;
      option.textContent = project.name;
      projectSelect.appendChild(option);
    });

    if (currentValue) {
      projectSelect.value = currentValue;
    }
  } catch (err) {
    console.error("Unable to get projects", err);
  }
}

async function getTickets() {
  const ticketDiv = document.getElementById("tickets");
  const errMessage = document.getElementById("tickets-error");
  const projectId = document.getElementById("project-select").value;

  if (!projectId) {
    ticketDiv.replaceChildren();
    errMessage.textContent = "Select a project to view tickets.";
    return;
  }

  await loadProjectMembers(projectId);

  try {
    const res = await fetch(`/api/tickets?projectId=${projectId}`);

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
      commentButton.textContent = "💬 Comments";
      upVoteButton.textContent = `▲ ${tick.vote_count}`;

      const commentsPanel = document.createElement("div");
      commentsPanel.className = "comments-panel hidden";

      commentButton.addEventListener("click", async () => {
        commentsPanel.classList.toggle("hidden");
        if (!commentsPanel.classList.contains("hidden")) {
          await loadComments(tick.id, commentsPanel);
        }
      });

      upVoteButton.addEventListener("click", async () => {
        const res = await fetch(`/api/votes/${tick.id}`, {
          method: "POST"
        });

        const data = await res.json();
        if (!res.ok) {
          // Shows up in the browser the error in a modal popup
          alert(data.error);
          return;
        }
        getTickets();
      });

      ticket.appendChild(title);
      ticket.appendChild(createdBy);
      ticket.appendChild(description);

      const tagsContainer = document.createElement("div");
      tagsContainer.className = "ticket-tags";

      function renderTagPills(tagList) {
        tagsContainer.innerHTML = "";
        tagList.forEach((tag) => {
          if (!tag) return;
          const pill = document.createElement("span");
          pill.className = "tag-pill";
          pill.textContent = tag;
          tagsContainer.appendChild(pill);
        });

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "edit-tags-button";
        editButton.textContent = "✎ Edit tags";
        editButton.addEventListener("click", () => {
          showTagEditor(tick.id, tagList.filter(Boolean), tagsContainer, renderTagPills);
        });
        tagsContainer.appendChild(editButton);
      }

      renderTagPills(tick.tags);
      ticket.append(tagsContainer);

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

      const statusSelect = document.createElement("select");
      statusSelect.className = "status-select";
      Object.entries(TICKET_STATUS_LABELS).forEach(([value, label]) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = label;
        if (value === tick.status) {
          option.selected = true;
        }
        statusSelect.appendChild(option);
      });
      statusSelect.addEventListener("change", () => {
        // TODO: once "Build API to update ticket status" is done,
        // PATCH /api/tickets/:id with { status: statusSelect.value }
        console.log(`Ticket ${tick.id} status change requested:`, statusSelect.value);
      });
      buttons.appendChild(statusSelect);

      const assignSelect = document.createElement("select");
      assignSelect.className = "assign-select";

      const unassignedOption = document.createElement("option");
      unassignedOption.value = "";
      unassignedOption.textContent = "Unassigned";
      assignSelect.appendChild(unassignedOption);

      projectMembers.forEach((member) => {
        const option = document.createElement("option");
        option.value = member.id;
        option.textContent = member.username;
        if (tick.assigned_to === member.id) {
          option.selected = true;
        }
        assignSelect.appendChild(option);
      });

      assignSelect.addEventListener("change", async () => {
        const res = await fetch(`/api/tickets/${tick.id}/assign`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assignedTo: assignSelect.value || null })
        });
        if (!res.ok) {
          const data = await res.json();
          alert(data.error);
          return;
        }
        getTickets();
      });
      buttons.appendChild(assignSelect);

      ticket.append(buttons);
      ticket.appendChild(commentsPanel);
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

getProjects();
getTickets();

document.getElementById("sort").addEventListener("change", getTickets);
document.getElementById("status-filter").addEventListener("change", getTickets);
document.getElementById("tag-filter").addEventListener("change", getTickets);
document.getElementById("project-select").addEventListener("change", getTickets);
document.getElementById("refresh-tickets").addEventListener("click", getTickets);