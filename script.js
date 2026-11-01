// The publishable key is meant to appear in site code. The table's policies decide what it can do.
const SUPABASE_URL = "https://qkebjsowepanoqsffsod.supabase.co";
const SUPABASE_KEY = "sb_publishable_u67cwytDJvj24f6mlZp2YQ_cpunIbJo";

const form = document.getElementById("add-form");
const input = document.getElementById("new-item");
const list = document.getElementById("list");
const summary = document.getElementById("summary");
const empty = document.getElementById("empty");
const errorMessage = document.getElementById("error");

let db;
let items = [];
let latestLoad = 0;

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.hidden = !message;
}

async function loadItems() {
  const thisLoad = ++latestLoad;
  const { data, error } = await db
    .from("items")
    .select("id, name, bought")
    .order("created_at");

  // A newer load has started, so this response may already be out of date.
  if (thisLoad !== latestLoad) return;

  if (error) {
    summary.textContent = "";
    showError("לא הצלחנו לטעון את הרשימה. בדקו את החיבור ונסו שוב.");
    return;
  }

  items = data;
  showError("");
  render();
}

async function addItem(name) {
  const { error } = await db.from("items").insert({ name });

  if (error) {
    input.value = name;
    showError("הפריט לא נוסף. נסו שוב.");
    return;
  }

  await loadItems();
}

async function setBought(item, bought) {
  const { error } = await db.from("items").update({ bought }).eq("id", item.id);

  await loadItems();
  if (error) showError("השינוי לא נשמר. נסו שוב.");
}

async function deleteItem(item) {
  const { error } = await db.from("items").delete().eq("id", item.id);

  await loadItems();
  if (error) showError("הפריט לא נמחק. נסו שוב.");
}

function createRow(item) {
  const row = document.createElement("li");
  row.classList.toggle("bought", item.bought);

  const label = document.createElement("label");

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = item.bought;
  checkbox.addEventListener("change", () => setBought(item, checkbox.checked));

  const name = document.createElement("span");
  name.textContent = item.name;

  label.append(checkbox, name);

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "delete";
  deleteButton.textContent = "×";
  deleteButton.setAttribute("aria-label", `מחיקת ${item.name}`);
  deleteButton.addEventListener("click", () => deleteItem(item));

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
  if (!name || !db) return;

  input.value = "";
  input.focus();
  addItem(name);
});

function start() {
  if (!window.supabase) {
    summary.textContent = "";
    showError("לא הצלחנו לטעון את האתר. רעננו את הדף ונסו שוב.");
    return;
  }

  db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  loadItems();

  // Any change by anyone reloads the list for everyone who has the site open.
  db.channel("items-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "items" }, loadItems)
    .subscribe();

  // Phones can drop the live connection in the background, so catch up on return.
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) loadItems();
  });
}

start();
