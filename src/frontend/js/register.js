const errorMessage = document.getElementById("errorMessage");
const register = document.getElementById("registerButton");

register.addEventListener("click", async () => {
  const username = document.getElementById("username").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  if (!username || !email || !password || !confirmPassword) {
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