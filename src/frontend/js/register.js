const companyOptions = document.getElementById("company");
const errorMessage = document.getElementById("errorMessage");
const register = document.getElementById("registerButton");

fetch("/api/companies")
  .then((response) => response.json())
  .then((companies) => {
    companies.forEach((company) => {
      const option = document.createElement("option");
      option.value = company.id;
      option.textContent = company.name;
      companyOptions.appendChild(option);
    });
  })
  .catch((error) => {
    errorMessage.textContent = "Error fetching companies.";
    console.error("Error fetching companies:", error);
  });

register.addEventListener("click", async () => {
  const username = document.getElementById("username").value;
  const email = document.getElementById("email").value;
  const company = companyOptions.value;
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  if (!username || !email || !company || !password || !confirmPassword) {
    errorMessage.textContent = "Please fill in all fields.";
    return;
  }

  if (password !== confirmPassword) {
    errorMessage.textContent = "Passwords do not match.";
    return;
  }

  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      username: username,
      email: email,
      company: company,
      password: password
    })
  });

  const res = await response.json();
  if (!response.ok) {
    errorMessage.textContent = res.error;
    return;
  }

  window.location.href = "/login";
});