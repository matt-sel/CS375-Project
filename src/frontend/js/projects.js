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

let statusChart = null;
let ticketsByDayChart = null;
let topContributorsChart = null;
let topVotedTicketsChart = null;
let cumulativeClosedChart = null;

async function loadTicketStatusChart(projectId) {
  if (!projectId) {
    return;
  }

  const response = await fetch(`/api/projects/${projectId}/telemetry/tickets-by-status`);
  if (!response.ok) {
    return;
  }

  const data = await response.json();
  const labels = data.map(row => row.status);
  const counts = data.map(row => parseInt(row.count));
  const canvas = document.getElementById("status-chart");

  // Have to remove any older charts before rebuilding
  if (statusChart) {
    statusChart.destroy();
  }

  statusChart = new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: labels,
      datasets: [{
        data: counts,
        backgroundColor: [
          "#e6cc75",
          "#ff6b6b",
          "#4ecdc4",
          "#95e1d3"
        ]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom"
        }
      }
    }
  });
}

async function loadTicketsByDayChart(projectId) {
  if (!projectId) {
    return;
  }

  const response = await fetch(`/api/projects/${projectId}/telemetry/tickets-by-day`);
  if (!response.ok) {
    return;
  }

  const data = await response.json();
  const labels = data.map(row => row.day);
  const openCounts = data.map(row => parseInt(row.open));
  const closedCounts = data.map(row => parseInt(row.closed));
  const canvas = document.getElementById("tickets-by-day-chart");

  if (ticketsByDayChart) {
    ticketsByDayChart.destroy();
  }

  ticketsByDayChart = new Chart(canvas, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Open",
          data: openCounts,
          backgroundColor: "#e6cc75"
        },
        {
          label: "Closed",
          data: closedCounts,
          backgroundColor: "#4ecdc4"
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        x: {
          stacked: true
        },
        y: {
          stacked: true,
          beginAtZero: true
        }
      },
      plugins: {
        legend: {
          display: true
        }
      }
    }
  });
}

async function loadCumulativeClosedChart(projectId) {
  if (!projectId) {
    return;
  }

  const response = await fetch(`/api/projects/${projectId}/telemetry/cumulative-closed`);
  if (!response.ok) {
    return;
  }

  const data = await response.json();
  const labels = data.map(row => row.day);
  const cumulativeCounts = data.map(row => parseInt(row.cumulative_count));
  const canvas = document.getElementById("cumulative-closed-chart");

  if (cumulativeClosedChart) {
    cumulativeClosedChart.destroy();
  }

  cumulativeClosedChart = new Chart(canvas, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: "Cumulative Tickets Closed",
        data: cumulativeCounts,
        borderColor: "#4ecdc4",
        backgroundColor: "rgba(78, 205, 196, 0.1)",
        borderWidth: 2,
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: true
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

async function loadTopContributorsChart(projectId) {
  if (!projectId) {
    return;
  }

  const response = await fetch(`/api/projects/${projectId}/telemetry/top-contributors`);
  if (!response.ok) {
    return;
  }

  const data = await response.json();
  const labels = data.map(row => row.username);
  const counts = data.map(row => parseInt(row.tickets_closed));
  const canvas = document.getElementById("top-contributors-chart");

  if (topContributorsChart) {
    topContributorsChart.destroy();
  }

  topContributorsChart = new Chart(canvas, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "Tickets Closed",
        data: counts,
        backgroundColor: "#e6cc75"
      }]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          beginAtZero: true
        }
      }
    }
  });
}

async function loadTopVotedTicketsChart(projectId) {
  if (!projectId) {
    return;
  }

  const response = await fetch(`/api/projects/${projectId}/telemetry/top-voted-tickets`);
  if (!response.ok) {
    return;
  }

  const data = await response.json();
  const labels = data.map(row => row.title);
  const votes = data.map(row => parseInt(row.vote_count));
  const canvas = document.getElementById("top-voted-tickets-chart");

  if (topVotedTicketsChart) {
    topVotedTicketsChart.destroy();
  }

  topVotedTicketsChart = new Chart(canvas, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "Votes",
        data: votes,
        backgroundColor: "#ff6b6b"
      }]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          beginAtZero: true
        }
      }
    }
  });
}

// Update all the charts whenever the project selection changes
telemetryProjectSelect.addEventListener("change", (e) => {
  loadTicketStatusChart(e.target.value);
  loadTicketsByDayChart(e.target.value);
  loadTopContributorsChart(e.target.value);
  loadTopVotedTicketsChart(e.target.value);
  loadCumulativeClosedChart(e.target.value);
});