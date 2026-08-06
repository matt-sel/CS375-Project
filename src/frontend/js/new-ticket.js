const submitButton = document.getElementById("submitTicketButton");
const errorMessage = document.getElementById("errorMessage");

const TITLE_MAX_LENGTH = 255;

submitButton.addEventListener("click", () => {
  const title = document.getElementById("title").value.trim();
  const description = document.getElementById("description").value.trim();
  const tagsRaw = document.getElementById("tags").value.trim();

  if (!title) {
    errorMessage.textContent = "Please provide a title.";
    return;
  }
  if (title.length > TITLE_MAX_LENGTH) {
    errorMessage.textContent = `Title must be ${TITLE_MAX_LENGTH} characters or fewer.`;
    return;
  }

  const tags = tagsRaw
    ? tagsRaw.split(",").map((t) => t.trim()).filter((t) => t.length > 0)
    : [];

  errorMessage.textContent = "";

  const ticketPayload = { title, description, tags };

  // TODO: wire this up once the "Build submit ticket to board logic/endpoint"
  // card is done - POST ticketPayload to /api/tickets
  console.log("Ticket ready to submit:", ticketPayload);
});