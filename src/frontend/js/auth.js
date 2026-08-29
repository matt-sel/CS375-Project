// Useful function to get the current user from the backend
async function getCurrentUser() {
    try {
        const res = await fetch("/api/auth/user");
        if (!res.ok) {
            return null;
        }
        const data = await res.json();
        return data.user;
    } catch (err) {
        return null;
    }
}

async function navbarInit() {
    const user = await getCurrentUser();

    const unauthedLinks = document.getElementById("unauthed-links");
    const authedLinks = document.getElementById("authed-links");
    const logoutLink = document.getElementById("logout-link");
    const accountLink = document.getElementById("account-link");

    // Flip whats visible based on if they are logged in
    if (user) {
        unauthedLinks.classList.add("hidden");
        authedLinks.classList.remove("hidden");
        if (accountLink) {
            accountLink.classList.add("hidden");
        }
    } else {
        unauthedLinks.classList.remove("hidden");
        authedLinks.classList.add("hidden");
        if (accountLink) {
            accountLink.classList.remove("hidden");
        }
    }

    logoutLink.addEventListener("click", async (e) => {
        const res = await fetch("/api/auth/logout", {
            method: "POST"
        });

        if (res.ok) {
            window.location.href = "/";
        }
    });
}

navbarInit();