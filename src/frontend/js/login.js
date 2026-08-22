const button = document.getElementById("loginButton");
const errorMessage = document.getElementById("errorMessage");

button.addEventListener("click", async () => {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
            email: email, 
            password: password 
        })
    });

    const data = await response.json();
    if (!response.ok) {
        errorMessage.textContent = data.error;
        return;
    }

    window.location.href = "/";
});