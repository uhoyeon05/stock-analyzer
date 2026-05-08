const STORAGE_KEYS = {
  projects: 'projects',
  projectColors: 'projectColors',
  tasks: 'tasks'
};

let projects = JSON.parse(localStorage.getItem(STORAGE_KEYS.projects) || '[]');
let projectColors = JSON.parse(localStorage.getItem(STORAGE_KEYS.projectColors) || '{}');
let tasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.tasks) || '[]');
let editingTaskId = null;
let currentMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
let activeView = 'taskView';

const palette = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#84CC16', '#F97316', '#14B8A6'];

const el = (id) => document.getElementById(id);

function saveAll() {
  localStorage.setItem(STORAGE_KEYS.projects, JSON.stringify(projects));
  localStorage.setItem(STORAGE_KEYS.projectColors, JSON.stringify(projectColors));
  localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(tasks));
}

function calcStatus(task) {
  if (task.completedDate) return 'Completed';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today > new Date(task.targetDate) ? 'Delayed' : 'In Progress';
}

function assignColor(project) {
  if (projectColors[project]) return;
  const used = Object.keys(projectColors).length;
  projectColors[project] = palette[used % palette.length];
}

function resetTaskForm() {
  el('taskForm').reset();
  editingTaskId = null;
  el('submitTaskBtn').textContent = 'Add Task';
}

function getFilteredTasks() {
  const filter = el('projectFilter').value;
  return filter === 'all' ? tasks : tasks.filter((t) => t.project === filter);
}

function renderProjectOptions() {
  const projectSelect = el('taskProject');
  const filterSelect = el('projectFilter');

  projectSelect.innerHTML = '<option value="">Select project</option>';
  filterSelect.innerHTML = '<option value="all">All Projects</option>';

  projects.forEach((p) => {
    projectSelect.insertAdjacentHTML('beforeend', `<option value="${p}">${p}</option>`);
    filterSelect.insertAdjacentHTML('beforeend', `<option value="${p}">${p}</option>`);
  });
}

function reorderByIds(dragId, targetId) {
  if (dragId === targetId) return;
  const from = tasks.findIndex((t) => t.id === dragId);
  const to = tasks.findIndex((t) => t.id === targetId);
  if (from < 0 || to < 0) return;
  const [moved] = tasks.splice(from, 1);
  tasks.splice(to, 0, moved);
  saveAll();
  renderTaskList();
  renderTimeline();
}

function renderTaskList() {
  tasks = tasks.map((t) => ({ ...t, status: calcStatus(t) }));
  saveAll();

  const tbody = el('taskTableBody');
  const list = getFilteredTasks();
  tbody.innerHTML = '';

  list.forEach((t) => {
    const tr = document.createElement('tr');
    tr.draggable = true;
    tr.dataset.id = t.id;
    tr.innerHTML = `
      <td>${t.project}</td>
      <td>${t.taskName}</td>
      <td>${t.startDate}</td>
      <td>${t.targetDate}</td>
      <td>${t.completedDate || ''}</td>
      <td>${t.status}</td>
      <td>${(t.memo || '').replace(/</g, '&lt;')}</td>
      <td>
        <button class="btn btn-sm btn-warning me-1" data-action="edit">Edit</button>
        <button class="btn btn-sm btn-danger" data-action="delete">Delete</button>
      </td>
    `;

    tr.addEventListener('dragstart', () => tr.classList.add('dragging'));
    tr.addEventListener('dragend', () => tr.classList.remove('dragging'));
    tr.addEventListener('dragover', (e) => e.preventDefault());
    tr.addEventListener('drop', () => {
      const dragging = tbody.querySelector('.dragging');
      if (!dragging) return;
      reorderByIds(Number(dragging.dataset.id), Number(tr.dataset.id));
    });

    tbody.appendChild(tr);
  });
}

function renderTimeline() {
  const grid = el('timelineGrid');
  const y = currentMonth.getFullYear();
  const m = currentMonth.getMonth();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const monthStart = new Date(y, m, 1);
  const monthEnd = new Date(y, m, daysInMonth);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  el('currentMonthLabel').textContent = `${y}-${String(m + 1).padStart(2, '0')}`;

  grid.style.gridTemplateColumns = `minmax(180px,max-content) minmax(240px,max-content) repeat(${daysInMonth}, var(--day-width))`;
  grid.innerHTML = '';

  const header = document.createElement('div');
  header.className = 'timeline-row timeline-header';
  header.innerHTML = `<div class="timeline-cell col-project">Project</div><div class="timeline-cell col-task">Task</div>`;
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(y, m, d);
    header.innerHTML += `<div class="timeline-cell col-day ${date.getTime() === today.getTime() ? 'today-col' : ''}">${d}</div>`;
  }
  grid.appendChild(header);

  const list = getFilteredTasks().filter((t) => {
    const s = new Date(t.startDate);
    const e = new Date(t.completedDate || t.targetDate);
    return e >= monthStart && s <= monthEnd;
  });

  list.forEach((t) => {
    const row = document.createElement('div');
    row.className = 'timeline-row timeline-task-row';
    row.draggable = true;
    row.dataset.id = t.id;

    const start = new Date(t.startDate);
    const end = new Date(t.completedDate || t.targetDate);

    row.innerHTML = `<div class="timeline-cell col-project">${t.project}</div><div class="timeline-cell col-task">${t.taskName}</div>`;

    for (let d = 1; d <= daysInMonth; d++) {
      const current = new Date(y, m, d);
      const active = current >= start && current <= end;
      const isToday = current.getTime() === today.getTime();
      let cell = `<div class="timeline-cell col-day ${isToday ? 'today-col' : ''}">`;
      if (active) {
        cell += `<div class="fill ${t.completedDate ? 'completed' : ''}" style="background:${projectColors[t.project] || '#64748b'}"></div>`;
      }
      cell += `</div>`;
      row.innerHTML += cell;
    }

    row.addEventListener('dragstart', () => row.classList.add('dragging'));
    row.addEventListener('dragend', () => row.classList.remove('dragging'));
    row.addEventListener('dragover', (e) => e.preventDefault());
    row.addEventListener('drop', () => {
      const dragging = grid.querySelector('.timeline-task-row.dragging');
      if (!dragging) return;
      reorderByIds(Number(dragging.dataset.id), Number(row.dataset.id));
    });

    grid.appendChild(row);
  });
}

el('addProjectBtn').addEventListener('click', () => {
  const name = el('projectNameInput').value.trim();
  if (!name) return;
  if (projects.includes(name)) {
    alert('같은 이름의 프로젝트는 등록할 수 없습니다.');
    return;
  }
  projects.push(name);
  assignColor(name);
  saveAll();
  renderProjectOptions();
  el('projectNameInput').value = '';
});

el('taskForm').addEventListener('submit', (e) => {
  e.preventDefault();
  if (projects.length === 0) {
    alert('프로젝트를 먼저 추가하세요.');
    return;
  }

  const payload = {
    project: el('taskProject').value,
    taskName: el('taskName').value.trim(),
    startDate: el('startDate').value,
    targetDate: el('targetDate').value,
    completedDate: el('completedDate').value,
    memo: el('memo').value.trim()
  };

  if (!payload.project || !payload.taskName || !payload.startDate || !payload.targetDate) return;
  if (new Date(payload.startDate) > new Date(payload.targetDate)) {
    alert('Start Date가 Target Date보다 늦을 수 없습니다.');
    return;
  }
  if (payload.completedDate && new Date(payload.completedDate) < new Date(payload.startDate)) {
    alert('Completed Date가 Start Date보다 빠를 수 없습니다.');
    return;
  }

  payload.status = calcStatus(payload);

  if (editingTaskId) {
    const idx = tasks.findIndex((t) => t.id === editingTaskId);
    if (idx >= 0) tasks[idx] = { ...tasks[idx], ...payload };
  } else {
    tasks.push({ id: Date.now(), ...payload });
  }

  saveAll();
  resetTaskForm();
  renderTaskList();
  renderTimeline();
});

el('taskTableBody').addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const row = e.target.closest('tr');
  const id = Number(row.dataset.id);
  const task = tasks.find((t) => t.id === id);
  if (!task) return;

  if (btn.dataset.action === 'edit') {
    editingTaskId = id;
    el('taskProject').value = task.project;
    el('taskName').value = task.taskName;
    el('startDate').value = task.startDate;
    el('targetDate').value = task.targetDate;
    el('completedDate').value = task.completedDate || '';
    el('memo').value = task.memo || '';
    el('submitTaskBtn').textContent = 'Save Changes';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (btn.dataset.action === 'delete') {
    if (!confirm('Delete this task?')) return;
    tasks = tasks.filter((t) => t.id !== id);
    if (editingTaskId === id) resetTaskForm();
    saveAll();
    renderTaskList();
    renderTimeline();
  }
});

el('projectFilter').addEventListener('change', () => {
  renderTaskList();
  renderTimeline();
});

el('prevMonthBtn').addEventListener('click', () => {
  currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
  renderTimeline();
});
el('nextMonthBtn').addEventListener('click', () => {
  currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
  renderTimeline();
});

el('topMenu').addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-view]');
  if (!btn) return;
  activeView = btn.dataset.view;
  document.querySelectorAll('#topMenu .nav-link').forEach((n) => n.classList.remove('active'));
  btn.classList.add('active');
  el('taskView').classList.toggle('d-none', activeView !== 'taskView');
  el('timelineView').classList.toggle('d-none', activeView !== 'timelineView');
  if (activeView === 'timelineView') renderTimeline();
});

projects.forEach(assignColor);
saveAll();
renderProjectOptions();
renderTaskList();
renderTimeline();
