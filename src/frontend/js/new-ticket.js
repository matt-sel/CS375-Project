const submitButton = document.getElementById("submitTicketButton");
const errorMessage = document.getElementById("errorMessage");

const TITLE_MAX_LENGTH = 255;
const DESCRIPTION_MAX_LENGTH = 2000;
const MAX_TAGS = 5;
const TAG_MAX_LENGTH = 30;

function validateTicket(title, description, tags) {
  if (!title) {
    return "Please provide a title.";
  }
  if (title.length > TITLE_MAX_LENGTH) {
    return `Title must be ${TITLE_MAX_LENGTH} characters or fewer.`;
  }
  if (description.length > DESCRIPTION_MAX_LENGTH) {
    return `Description must be ${DESCRIPTION_MAX_LENGTH} characters or fewer.`;
  }
  if (tags.length > MAX_TAGS) {
    return `Please use ${MAX_TAGS} tags or fewer.`;
  }
  const longTag = tags.find((t) => t.length > TAG_MAX_LENGTH);
  if (longTag) {
    return `Tag "${longTag}" is too long (max ${TAG_MAX_LENGTH} characters).`;
  }
  return null;
}

function parseTags(tagsRaw) {
  return tagsRaw
    ? tagsRaw.split(",").map((t) => t.trim()).filter((t) => t.length > 0)
    : [];
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
  const tags = parseTags(document.getElementById("tags").value.trim());

  const validationError = validateTicket(title, description, tags);
  if (validationError) {
    errorMessage.textContent = validationError;
    return;
  }

  errorMessage.textContent = "";

  const ticketPayload = { title, description, tags };

  // TODO: once "Build submit ticket to board logic/endpoint" is done,
  // POST ticketPayload to /api/tickets, then call:
  // showTicketConfirmation(ticketPayload);
  console.log("Ticket ready to submit:", ticketPayload);
  showTicketConfirmation(ticketPayload);
});