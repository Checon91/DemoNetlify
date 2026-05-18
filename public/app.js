const state = {
  token: localStorage.getItem("pulsedesk_token"),
  user: null,
  projects: [],
  filter: "all",
  authMode: "register",
  editingId: null
};

const els = {
  authView: document.querySelector("#authView"),
  dashboardView: document.querySelector("#dashboardView"),
  authForm: document.querySelector("#authForm"),
  authTitle: document.querySelector("#authTitle"),
  toggleAuth: document.querySelector("#toggleAuth"),
  authSubmit: document.querySelector("#authSubmit"),
  authMessage: document.querySelector("#authMessage"),
  nameField: document.querySelector("#nameField"),
  accountCard: document.querySelector("#accountCard"),
  accountName: document.querySelector("#accountName"),
  logoutButton: document.querySelector("#logoutButton"),
  projectForm: document.querySelector("#projectForm"),
  projectFormTitle: document.querySelector("#projectFormTitle"),
  projectSubmit: document.querySelector("#projectSubmit"),
  projectMessage: document.querySelector("#projectMessage"),
  cancelEditButton: document.querySelector("#cancelEditButton"),
  newProjectButton: document.querySelector("#newProjectButton"),
  projectList: document.querySelector("#projectList"),
  totalCount: document.querySelector("#totalCount"),
  activeCount: document.querySelector("#activeCount"),
  completedCount: document.querySelector("#completedCount"),
  filters: document.querySelectorAll("[data-filter]")
};

async function api(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}),
      ...(options.headers || {})
    }
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "La solicitud fallo.");
  }

  return data;
}

function setAuth(token, user) {
  state.token = token;
  state.user = user;
  localStorage.setItem("pulsedesk_token", token);
}

function clearAuth() {
  state.token = null;
  state.user = null;
  state.projects = [];
  localStorage.removeItem("pulsedesk_token");
}

function showAuth() {
  els.authView.hidden = false;
  els.dashboardView.hidden = true;
  els.accountCard.hidden = true;
}

function showDashboard() {
  els.authView.hidden = true;
  els.dashboardView.hidden = false;
  els.accountCard.hidden = false;
  els.accountName.textContent = state.user ? state.user.name : "";
}

function setAuthMode(mode) {
  state.authMode = mode;
  const isRegister = mode === "register";
  els.authTitle.textContent = isRegister ? "Crear cuenta" : "Iniciar sesion";
  els.authSubmit.textContent = isRegister ? "Crear cuenta" : "Iniciar sesion";
  els.toggleAuth.textContent = isRegister ? "Iniciar sesion" : "Crear cuenta";
  els.nameField.hidden = !isRegister;
  els.authMessage.textContent = "";
}

function projectFormData() {
  const formData = new FormData(els.projectForm);
  return {
    title: formData.get("title"),
    description: formData.get("description"),
    priority: formData.get("priority"),
    dueDate: formData.get("dueDate"),
    status: formData.get("status")
  };
}

function resetProjectForm() {
  state.editingId = null;
  els.projectForm.reset();
  els.projectFormTitle.textContent = "Agregar proyecto";
  els.projectSubmit.textContent = "Guardar proyecto";
  els.cancelEditButton.hidden = true;
  els.projectMessage.textContent = "";
}

function startEdit(project) {
  state.editingId = project.id;
  els.projectForm.title.value = project.title;
  els.projectForm.description.value = project.description || "";
  els.projectForm.priority.value = project.priority;
  els.projectForm.dueDate.value = project.dueDate || "";
  els.projectForm.status.value = project.status;
  els.projectFormTitle.textContent = "Editar proyecto";
  els.projectSubmit.textContent = "Actualizar proyecto";
  els.cancelEditButton.hidden = false;
  els.projectForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

function formatDate(value) {
  if (!value) return "Sin fecha limite";
  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString("es-MX", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function filteredProjects() {
  if (state.filter === "all") return state.projects;
  return state.projects.filter((project) => project.status === state.filter);
}

function renderStats() {
  const active = state.projects.filter((project) => project.status === "active").length;
  const completed = state.projects.filter((project) => project.status === "completed").length;
  els.totalCount.textContent = state.projects.length;
  els.activeCount.textContent = active;
  els.completedCount.textContent = completed;
}

function renderProjects() {
  renderStats();

  els.filters.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.filter === state.filter);
  });

  const projects = filteredProjects();

  if (projects.length === 0) {
    els.projectList.innerHTML = `
      <div class="empty-state">
        ${emptyStateText()}
      </div>
    `;
    return;
  }

  els.projectList.innerHTML = projects
    .map(
      (project) => `
        <article class="project-card" data-id="${project.id}">
          <header>
            <div>
              <h3>${escapeHtml(project.title)}</h3>
              <div class="badge-row">
                <span class="badge ${project.priority}">${priorityLabel(project.priority)}</span>
                <span class="badge">${statusLabel(project.status)}</span>
                <span class="badge">${formatDate(project.dueDate)}</span>
              </div>
            </div>
            <div class="action-row">
              <button class="icon-button" type="button" data-action="toggle" title="Cambiar estado">
                ${project.status === "completed" ? "Abrir" : "Listo"}
              </button>
              <button class="icon-button" type="button" data-action="edit" title="Editar proyecto">Editar</button>
              <button class="icon-button" type="button" data-action="delete" title="Eliminar proyecto">Borrar</button>
            </div>
          </header>
          <p>${escapeHtml(project.description || "Sin descripcion todavia.")}</p>
        </article>
      `
    )
    .join("");
}

function priorityLabel(priority) {
  const labels = {
    low: "Baja",
    medium: "Media",
    high: "Alta"
  };

  return labels[priority] || priority;
}

function statusLabel(status) {
  const labels = {
    active: "Activo",
    completed: "Completado"
  };

  return labels[status] || status;
}

function emptyStateText() {
  const labels = {
    all: "Todavia no hay proyectos.",
    active: "Todavia no hay proyectos activos.",
    completed: "Todavia no hay proyectos completados."
  };

  return labels[state.filter] || "Todavia no hay proyectos.";
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };
    return entities[char];
  });
}

async function loadProjects() {
  const data = await api("/projects");
  state.projects = data.projects;
  renderProjects();
}

els.toggleAuth.addEventListener("click", () => {
  setAuthMode(state.authMode === "register" ? "login" : "register");
});

els.authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  els.authMessage.textContent = "";

  const formData = new FormData(els.authForm);
  const payload = {
    email: formData.get("email"),
    password: formData.get("password")
  };

  if (state.authMode === "register") {
    payload.name = formData.get("name");
  }

  try {
    const data = await api(state.authMode === "register" ? "/auth/register" : "/auth/login", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    setAuth(data.token, data.user);
    showDashboard();
    await loadProjects();
  } catch (error) {
    els.authMessage.textContent = error.message;
  }
});

els.logoutButton.addEventListener("click", () => {
  clearAuth();
  showAuth();
});

els.projectForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  els.projectMessage.textContent = "";

  try {
    const payload = projectFormData();
    const path = state.editingId ? `/projects/${state.editingId}` : "/projects";
    const method = state.editingId ? "PATCH" : "POST";
    await api(path, {
      method,
      body: JSON.stringify(payload)
    });

    resetProjectForm();
    await loadProjects();
  } catch (error) {
    els.projectMessage.textContent = error.message;
  }
});

els.projectList.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-action]");
  const card = event.target.closest("[data-id]");

  if (!button || !card) return;

  const project = state.projects.find((item) => item.id === card.dataset.id);
  if (!project) return;

  const action = button.dataset.action;

  if (action === "edit") {
    startEdit(project);
    return;
  }

  try {
    if (action === "delete") {
      await api(`/projects/${project.id}`, { method: "DELETE" });
    }

    if (action === "toggle") {
      await api(`/projects/${project.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          ...project,
          status: project.status === "completed" ? "active" : "completed"
        })
      });
    }

    await loadProjects();
  } catch (error) {
    els.projectMessage.textContent = error.message;
  }
});

els.cancelEditButton.addEventListener("click", resetProjectForm);

els.newProjectButton.addEventListener("click", () => {
  resetProjectForm();
  els.projectForm.scrollIntoView({ behavior: "smooth", block: "start" });
});

els.filters.forEach((button) => {
  button.addEventListener("click", () => {
    state.filter = button.dataset.filter;
    renderProjects();
  });
});

async function bootstrap() {
  setAuthMode("register");

  if (!state.token) {
    showAuth();
    return;
  }

  try {
    const data = await api("/auth/me");
    state.user = data.user;
    showDashboard();
    await loadProjects();
  } catch (error) {
    clearAuth();
    showAuth();
  }
}

bootstrap();
