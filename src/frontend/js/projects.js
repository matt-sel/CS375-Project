const projectSelect = document.getElementById("project-select");
const telemetryProjectSelect = document.getElementById("telemetry-project-select");
const message = document.getElementById("project-message");

function populateProjectOptions(selectElement) {
  if (!selectElement) {
    return;
  }

  selectElement.replaceChildren();

  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Select a project";
  selectElement.appendChild(defaultOption);
}

async function loadProjects() {
  const response = await fetch("/api/projects");
  if (!response.ok) {
    throw new Error("Unable to load projects");
  }

  const projects = await response.json();

  populateProjectOptions(projectSelect);
  populateProjectOptions(telemetryProjectSelect);

  projects.forEach((project) => {
    const projectOption = document.createElement("option");
    projectOption.value = project.id;
    projectOption.textContent = project.name;

    if (projectSelect) {
      const option = document.createElement("option");
      option.value = project.id;
      option.textContent = project.name;
      projectSelect.appendChild(option);
    }

    if (telemetryProjectSelect) {
      const telemetryOption = document.createElement("option");
      telemetryOption.value = project.id;
      telemetryOption.textContent = project.name;
      telemetryProjectSelect.appendChild(telemetryOption);
    }
  });
}

document.getElementById("create-project-button").addEventListener("click", async () => {
  const name = document.getElementById("project-name").value.trim();

  if (!name) {
    message.textContent = "Please provide a project name.";
    return;
  }

  const response = await fetch("/api/projects", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ name: name })
  });

  const data = await response.json();
  message.textContent = response.ok ? "Project created." : data.error;

  if (response.ok) {
    document.getElementById("project-name").value = "";
    await loadProjects();
    projectSelect.value = data.id;
  }
});

document.getElementById("add-member-button").addEventListener("click", async () => {
  const projectId = projectSelect.value;
  const username = document.getElementById("member-username").value.trim();

  if (!projectId || !username) {
    message.textContent = "Select a project and provide a username.";
    return;
  }

  const response = await fetch(`/api/projects/${projectId}/members`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ username: username })
  });

  const data = await response.json();
  message.textContent = response.ok ? "User added to project." : data.error;

  if (response.ok) {
    document.getElementById("member-username").value = "";
  }
});

loadProjects().catch(() => {
  message.textContent = "Unable to load projects.";
});
