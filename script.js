const STORAGE_KEY = "shopping-list";

const form = document.getElementById("add-form");
const input = document.getElementById("new-item");
const list = document.getElementById("list");
const summary = document.getElementById("summary");
const empty = document.getElementById("empty");

let items = loadItems();

function loadItems() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveItems() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // The list still works until the page closes if the browser blocks saving.
  }
}

function update() {
  saveItems();
  render();
}

function createRow(item) {
  const row = document.createElement("li");
  row.classList.toggle("bought", item.bought);

  const label = document.createElement("label");

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = item.bought;
  checkbox.addEventListener("change", () => {
    item.bought = checkbox.checked;
    update();
  });

  const name = document.createElement("span");
  name.textContent = item.name;

  label.append(checkbox, name);

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "delete";
  deleteButton.textContent = "×";
  deleteButton.setAttribute("aria-label", `מחיקת ${item.name}`);
  deleteButton.addEventListener("click", () => {
    items = items.filter((other) => other.id !== item.id);
    update();
  });

  row.append(label, deleteButton);
  return row;
}

function render() {
  list.replaceChildren(...items.map(createRow));

  const remaining = items.filter((item) => !item.bought).length;
  summary.textContent = items.length ? `נשארו ${remaining} מתוך ${items.length}` : "";
  summary.hidden = items.length === 0;
  empty.hidden = items.length > 0;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = input.value.trim();
  if (!name) return;

  items.push({ id: crypto.randomUUID(), name, bought: false });
  input.value = "";
  input.focus();
  update();
});

render();
