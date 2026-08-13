const submitButton = document.getElementById("submitTicketButton");
const errorMessage = document.getElementById("errorMessage");
const tagInput = document.getElementById("tagInput");
const addTagButton = document.getElementById("addTagButton");
const selectedTagsDiv = document.getElementById("selectedTags");

const TITLE_MAX_LENGTH = 255;
const DESCRIPTION_MAX_LENGTH = 2000;
const MAX_TAGS = 5;
const TAG_MAX_LENGTH = 30;

let tags = [];

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

submitButton.addEventListener("click", () => {
  const title = document.getElementById("title").value.trim();
  const description = document.getElementById("description").value.trim();

  const validationError = validateTicket(title, description);
  if (validationError) {
    errorMessage.textContent = validationError;
    return;
  }

  errorMessage.textContent = "";
  const ticketPayload = { title, description, tags };

  // TODO: once "Build submit ticket to board logic/endpoint" is done,
  // POST ticketPayload to /api/tickets
  console.log("Ticket ready to submit:", ticketPayload);
  showTicketConfirmation(ticketPayload);
});