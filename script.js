// Mira's Cargo Admin — Firebase Realtime Database
// Firebase config нь өмнөх төслөөс хадгалагдсан. Нууц үгийг кодонд хадгалахгүй.
const firebaseConfig = {
  apiKey: "AIzaSyDDak9FnmcOH2eOdrlmIzogX9wHhXVfQQI",
  authDomain: "mirascargo-397d1.firebaseapp.com",
  databaseURL: "https://mirascargo-397d1-default-rtdb.firebaseio.com",
  projectId: "mirascargo-397d1",
  storageBucket: "mirascargo-397d1.firebasestorage.app",
  messagingSenderId: "747920145779",
  appId: "1:747920145779:web:71f6e0140eb183f6f25906",
  measurementId: "G-ED3X9VG2EE"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

// Firebase Console → Authentication → Users хэсгээс өөрийн админы UID-г хуулж энд тавина.
// UID-г тохируулаагүй үед админ хэсэг нээгдэхгүй.
const ADMIN_UID = "PASTE_YOUR_ADMIN_UID_HERE";
let cargoCache = {};
let bulkList = [];

const $ = id => document.getElementById(id);
const money = value => (Number(value) || 0).toLocaleString("mn-MN") + "₮";
const normalizePhone = value => String(value || "").replace(/\\s+/g, "");
const normalizeSearch = value => String(value || "").trim().toLowerCase().replace(/\\s+/g, "");
const makeSearchKey = (phone, track) => normalizeSearch(phone) + "|" + normalizeSearch(track);
const safe = value => String(value ?? "").replace(/[&<>"']/g, ch => ({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
}[ch]));

function toast(message) {
  const node = $("toast");
  node.textContent = message;
  node.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => node.classList.remove("show"), 2800);
}
function setLoggedIn(user) {
  const allowed = !!user && ADMIN_UID !== "PASTE_YOUR_ADMIN_UID_HERE" && user.uid === ADMIN_UID;
  $("loginPage").hidden = allowed;
  $("adminPage").hidden = !allowed;
  if (user && !allowed) {
    auth.signOut();
    $("loginError").textContent = "Энэ бүртгэл админы эрхгүй байна.";
    return;
  }
  if (allowed) startCargoListener();
}
auth.onAuthStateChanged(user => setLoggedIn(user));

$("loginForm").addEventListener("submit", async event => {
  event.preventDefault();
  $("loginError").textContent = "";
  try {
    await auth.signInWithEmailAndPassword($("email").value.trim(), $("password").value);
  } catch (error) {
    $("loginError").textContent = friendlyAuthError(error);
  }
});
function friendlyAuthError(error) {
  if (["auth/invalid-credential","auth/user-not-found","auth/wrong-password"].includes(error.code))
    return "Имэйл эсвэл нууц үг буруу байна.";
  if (error.code === "auth/too-many-requests") return "Олон удаа оролдлоо. Түр хүлээгээд дахин оролдоно уу.";
  return "Нэвтрэхэд алдаа гарлаа: " + (error.message || error.code);
}
$("logoutBtn").addEventListener("click", () => auth.signOut());

document.querySelectorAll(".tab").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(b => b.classList.toggle("active", b === button));
    document.querySelectorAll(".tab-panel").forEach(panel => panel.hidden = panel.id !== button.dataset.tab);
  });
});

$("singleForm").addEventListener("submit", async event => {
  event.preventDefault();
  const cargo = {
    date: $("date").value,
    phone: normalizePhone($("phone").value),
    track: $("track").value.trim(),
    price: Number($("price").value)
  };
  if (!cargo.date || !cargo.phone || !cargo.track || !Number.isFinite(cargo.price) || cargo.price < 0) {
    toast("Мэдээллээ зөв бүрэн оруулна уу."); return;
  }
  try {
    await db.ref("cargo").push(cargo);
    $("singleForm").reset();
    $("date").value = new Date().toLocaleDateString("en-CA");
    toast("Ачаа амжилттай хадгалагдлаа.");
  } catch (error) { toast("Хадгалах алдаа: " + error.message); }
});

function parseBulk(text) {
  const valid = [], invalid = [];
  text.split(/\r?\n/).forEach((line, index) => {
    if (!line.trim()) return;
    let parts;
    if (line.includes("\t")) parts = line.split("\t").map(x => x.trim());
    else if (line.includes(",")) parts = line.split(",").map(x => x.trim());
    else parts = line.trim().split(/\s+/);
    if (parts.length < 3) { invalid.push(index + 1); return; }
    const phone = normalizePhone(parts[0]), track = parts[1];
    const priceText = parts.slice(2).join("").replace(/[,\s₮]/g, "");
    const price = Number(priceText);
    if (!phone || !track || !Number.isFinite(price) || price < 0) { invalid.push(index + 1); return; }
    valid.push({phone, track, price});
  });
  return {valid, invalid};
}
$("previewBulkBtn").addEventListener("click", () => {
  const parsed = parseBulk($("bulkData").value);
  bulkList = parsed.valid;
  $("saveBulkBtn").disabled = bulkList.length === 0;
  if (!bulkList.length) {
    $("previewTable").innerHTML = '<p class="error">Зөв мэдээлэл олдсонгүй. Форматаа шалгана уу.</p>';
    return;
  }
  let html = `<p class="help">Зөв мөр: <b>${bulkList.length}</b> · Алдаатай мөр: <b>${parsed.invalid.length}</b></p>
    <table><thead><tr><th>#</th><th>Утас</th><th>Track</th><th>Үнэ</th></tr></thead><tbody>`;
  bulkList.forEach((item, i) => {
    html += `<tr><td>${i+1}</td><td>${safe(item.phone)}</td><td>${safe(item.track)}</td><td>${money(item.price)}</td></tr>`;
  });
  html += "</tbody></table>";
  if (parsed.invalid.length) html += `<p class="error">Алдаатай мөрийн дугаар: ${parsed.invalid.join(", ")}</p>`;
  $("previewTable").innerHTML = html;
});
$("saveBulkBtn").addEventListener("click", async () => {
  const date = $("date").value;
  if (!date) { toast("Эхлээд огноо сонгоно уу."); return; }
  if (!bulkList.length) { toast("Эхлээд урьдчилж харах товчийг дарна уу."); return; }
  if (!confirm(`${bulkList.length} ачааг ${date} огноогоор хадгалах уу?`)) return;
  const updates = {};
  bulkList.forEach(item => {
    const key = db.ref("cargo").push().key;
    updates["cargo/" + key] = {...item, date};
  });
  try {
    await db.ref().update(updates);
    toast(`${bulkList.length} ачаа амжилттай хадгалагдлаа.`);
    $("bulkData").value = "";
    $("previewTable").innerHTML = "";
    bulkList = [];
    $("saveBulkBtn").disabled = true;
  } catch (error) { toast("Хадгалах алдаа: " + error.message); }
});

let listenerStarted = false;
function startCargoListener() {
  if (listenerStarted) return;
  listenerStarted = true;
  db.ref("cargo").on("value", snapshot => {
    cargoCache = {};
    snapshot.forEach(child => cargoCache[child.key] = child.val() || {});
    renderCargo();
  }, error => toast("Мэдээлэл унших алдаа: " + error.message));
}
function renderCargo() {
  const entries = Object.entries(cargoCache);
  const total = entries.reduce((sum, [, item]) => sum + (Number(item.price) || 0), 0);
  $("totalCargo").textContent = entries.length.toLocaleString("mn-MN");
  $("totalIncome").textContent = money(total);
  const query = ($("filterInput").value || "").trim().toLowerCase();
  const filtered = entries.filter(([, item]) =>
    String(item.phone || "").toLowerCase().includes(query) ||
    String(item.track || "").toLowerCase().includes(query)
  ).reverse();
  $("cargoTable").innerHTML = filtered.length ? filtered.map(([key, item]) => `
    <tr>
      <td>${safe(item.date || "")}</td><td>${safe(item.phone || "")}</td>
      <td>${safe(item.track || "")}</td><td>${money(item.price)}</td>
      <td><button class="action-btn" data-edit="${safe(key)}" type="button">Засах</button>
      <button class="action-btn delete-btn" data-delete="${safe(key)}" type="button">Устгах</button></td>
    </tr>`).join("") : '<tr><td colspan="5" class="empty">Ачаа бүртгэгдээгүй байна.</td></tr>';
}
$("filterInput").addEventListener("input", renderCargo);

$("cargoTable").addEventListener("click", async event => {
  const editKey = event.target.dataset.edit;
  const deleteKey = event.target.dataset.delete;
  if (editKey) await editCargo(editKey);
  if (deleteKey) await deleteCargo(deleteKey);
});
async function editCargo(key) {
  const item = cargoCache[key];
  if (!item) return;
  const date = prompt("Огноо (YYYY-MM-DD):", item.date || "");
  if (date === null) return;
  const phone = prompt("Утасны дугаар:", item.phone || "");
  if (phone === null) return;
  const track = prompt("Track code:", item.track || "");
  if (track === null) return;
  const rawPrice = prompt("Үнэ (₮):", item.price ?? 0);
  if (rawPrice === null) return;
  const price = Number(rawPrice.replace(/[,\s₮]/g, ""));
  if (!date.trim() || !phone.trim() || !track.trim() || !Number.isFinite(price) || price < 0) {
    toast("Оруулсан мэдээлэл буруу байна."); return;
  }
  try {
    await db.ref("cargo/" + key).update({date:date.trim(), phone:phone.trim(), track:track.trim(), price});
    toast("Ачааны мэдээлэл шинэчлэгдлээ.");
  } catch (error) { toast("Засах алдаа: " + error.message); }
}
async function deleteCargo(key) {
  if (!confirm("Энэ ачааг бүр мөсөн устгах уу?")) return;
  try {
    await db.ref("cargo/" + key).remove();
    toast("Ачаа устгагдлаа.");
  } catch (error) { toast("Устгах алдаа: " + error.message); }
}

$("searchForm").addEventListener("submit", async event => {
  event.preventDefault();
  const term = $("searchTrack").value.trim();
  if (!term) return;
  $("searchResult").innerHTML = '<p class="help">Хайж байна…</p>';
  try {
    const snapshot = await db.ref("cargo").orderByChild("track").equalTo(term).once("value");
    const found = [];
    snapshot.forEach(child => found.push(child.val()));
    $("searchResult").innerHTML = found.length ? found.map(item => `
      <article class="result-card"><b>📦 Ачааны мэдээлэл</b>
      <p><b>Огноо:</b> ${safe(item.date || "")}</p>
      <p><b>Утас:</b> ${safe(item.phone || "")}</p>
      <p><b>Track:</b> ${safe(item.track || "")}</p>
      <p><b>Үнэ:</b> ${money(item.price)}</p></article>`).join("") : '<p class="help">Ийм Track code олдсонгүй.</p>';
  } catch (error) { $("searchResult").textContent = "Хайлт хийхэд алдаа: " + error.message; }
});

$("date").value = new Date().toLocaleDateString("en-CA");
