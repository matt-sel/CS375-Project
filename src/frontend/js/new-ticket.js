const submitButton = document.getElementById("submitTicketButton");
const errorMessage = document.getElementById("errorMessage");
const tagInput = document.getElementById("tagInput");
const addTagButton = document.getElementById("addTagButton");
const selectedTagsDiv = document.getElementById("selectedTags");
const projectSelect = document.getElementById("project-select");

const TITLE_MAX_LENGTH = 255;
const DESCRIPTION_MAX_LENGTH = 2000;
const MAX_TAGS = 5;
const TAG_MAX_LENGTH = 30;

let tags = [];

async function getProjects() {
  try {
    const res = await fetch("/api/projects");
    if (!res.ok) {
      errorMessage.textContent = "Unable to load projects";
      return;
    }

    const projects = await res.json();
    projects.forEach((project) => {
      const option = document.createElement("option");
      option.value = project.id;
      option.textContent = project.name;
      projectSelect.appendChild(option);
    });
  } catch (err) {
    errorMessage.textContent = "Unable to load projects";
  }
}

function renderTags() {
  selectedTagsDiv.innerHTML = "";
  tags.forEach((tag, index) => {
    const pill = document.createElement("span");
    pill.className = "tag-pill";

    const label = document.createElement("span");
    label.textContent = tag;

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.textContent = "×";
    removeButton.addEventListener("click", () => {
      tags.splice(index, 1);
      renderTags();
    });

    pill.appendChild(label);
    pill.appendChild(removeButton);
    selectedTagsDiv.appendChild(pill);
  });
}

function addTag() {
  const value = tagInput.value.trim();
  if (!value) {
    return;
  }
  if (value.length > TAG_MAX_LENGTH) {
    errorMessage.textContent = `Tag "${value}" is too long (max ${TAG_MAX_LENGTH} characters).`;
    return;
  }
  if (tags.length >= MAX_TAGS) {
    errorMessage.textContent = `Please use ${MAX_TAGS} tags or fewer.`;
    return;
  }
  if (tags.includes(value)) {
    tagInput.value = "";
    return;
  }
  errorMessage.textContent = "";
  tags.push(value);
  tagInput.value = "";
  renderTags();
}

addTagButton.addEventListener("click", addTag);
tagInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    addTag();
  }
});

function validateTicket(title, description) {
  if (!title) {
    return "Please provide a title.";
  }
  if (title.length > TITLE_MAX_LENGTH) {
    return `Title must be ${TITLE_MAX_LENGTH} characters or fewer.`;
  }
  if (description.length > DESCRIPTION_MAX_LENGTH) {
    return `Description must be ${DESCRIPTION_MAX_LENGTH} characters or fewer.`;
  }
  return null;
}

function showTicketConfirmation(ticket) {
  const formContainer = document.getElementById("ticketForm");
  const confirmation = document.getElementById("ticketConfirmation");

  document.getElementById("confirmTitle").textContent = ticket.title;
  document.getElementById("confirmDescription").textContent =
    ticket.description || "(no description provided)";

  const tagList = document.getElementById("confirmTags");
  tagList.innerHTML = "";
  if (ticket.tags.length === 0) {
    tagList.textContent = "(no tags)";
  } else {
    ticket.tags.forEach((tag) => {
      const span = document.createElement("span");
      span.className = "tag-pill";
      span.textContent = tag;
      tagList.appendChild(span);
    });
  }

  formContainer.style.display = "none";
  confirmation.style.display = "block";
}

submitButton.addEventListener("click", async () => {
  const title = document.getElementById("title").value.trim();
  const projectId = projectSelect.value;
  const description = document.getElementById("description").value.trim();

  if (!projectId) {
    errorMessage.textContent = "Please select a project.";
    return;
  }

  const validationError = validateTicket(title, description);
  if (validationError) {
    errorMessage.textContent = validationError;
    return;
  }

  errorMessage.textContent = "";
  const ticketPayload = { projectId, title, description, tags };

  try {
    const res = await fetch("/api/tickets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(ticketPayload)
    });

    const data = await res.json();
    if (!res.ok) {
      errorMessage.textContent = data.error;
      return;
    }

    showTicketConfirmation(ticketPayload);
  } catch (err) {
    errorMessage.textContent = "Unable to submit ticket";
  }
});

getProjects();