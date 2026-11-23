
// ========================================
// MIRA'S CARGO - MAIN SCRIPT
// Firebase Realtime Database
// ========================================

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

// ADMIN UID
const ADMIN_UID = "FV2Zr0E8FlO6BLDxtiXds4Ukds23";

let cargoCache = {};
let bulkList = [];
let listenerStarted = false;

const $ = id => document.getElementById(id);

const money = value =>
  (Number(value) || 0).toLocaleString("mn-MN") + "₮";

const normalizePhone = value =>
  String(value || "").replace(/\D/g, "");

const normalizeSearch = value =>
  String(value || "").trim().toLowerCase();

const safe = value =>
  String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[ch]));

function toast(message) {
  const node = $("toast");
  if (!node) {
    alert(message);
    return;
  }
  node.textContent = message;
  node.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(
    () => node.classList.remove("show"), 2800
  );
}

// ========================================
// ADMIN LOGIN
// ========================================

function setLoggedIn(user) {
  const allowed = !!user && user.uid === ADMIN_UID;

  $("loginPage").hidden = allowed;
  $("adminPage").hidden = !allowed;

  if (user && !allowed) {
    auth.signOut();
    $("loginError").textContent =
      "Энэ бүртгэл админы эрхгүй байна.";
    return;
  }

  if (allowed) startCargoListener();
}

auth.onAuthStateChanged(setLoggedIn);

$("loginForm").addEventListener("submit", async event => {
  event.preventDefault();
  $("loginError").textContent = "";

  try {
    await auth.signInWithEmailAndPassword(
      $("email").value.trim(),
      $("password").value
    );
  } catch (error) {
    $("loginError").textContent =
      friendlyAuthError(error);
  }
});

function friendlyAuthError(error) {
  if ([
    "auth/invalid-credential",
    "auth/user-not-found",
    "auth/wrong-password"
  ].includes(error.code)) {
    return "Имэйл эсвэл нууц үг буруу байна.";
  }

  if (error.code === "auth/too-many-requests") {
    return "Олон удаа оролдлоо. Түр хүлээнэ үү.";
  }

  return "Нэвтрэхэд алдаа: " + error.message;
}

$("logoutBtn").addEventListener("click", () =>
  auth.signOut()
);

// ========================================
// ADMIN TABS
// ========================================

document.querySelectorAll(".tab").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(b =>
      b.classList.toggle("active", b === button)
    );

    document.querySelectorAll(".tab-panel").forEach(panel =>
      panel.hidden = panel.id !== button.dataset.tab
    );
  });
});

// ========================================
// ADD SINGLE CARGO
// ========================================

$("singleForm").addEventListener("submit", async event => {
  event.preventDefault();

  const cargo = {
    date: $("date").value,
    phone: normalizePhone($("phone").value),
    track: $("track").value.trim(),
    price: Number($("price").value)
  };

  if (
    !cargo.date ||
    cargo.phone.length < 8 ||
    !cargo.track ||
    !Number.isFinite(cargo.price) ||
    cargo.price < 0
  ) {
    toast("Мэдээллээ зөв бүрэн оруулна уу.");
    return;
  }

  try {
    await db.ref("cargo").push(cargo);
    $("singleForm").reset();
    $("date").value = new Date().toLocaleDateString("en-CA");
    toast("Ачаа амжилттай хадгалагдлаа.");
  } catch (error) {
    toast("Хадгалах алдаа: " + error.message);
  }
});

// ========================================
// BULK CARGO IMPORT
// ========================================

function parseBulk(text) {
  const valid = [];
  const invalid = [];

  let currentPhone = "";
  let currentDate = "";

  const cleanDate = value => {
    const s = String(value || "").trim();
    const match = s.match(
      /^(\d{4})[./](\d{1,2})[./](\d{1,2})$/
    );

    if (match) {
      return `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;
    }

    return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : "";
  };

  text.split(/\r?\n/).forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (!line) return;

    if (/^(нийт|niit|total)\b/i.test(line)) return;

    const date = cleanDate(line);
    if (date) {
      currentDate = date;
      return;
    }

    const phoneCandidate = line
      .replace(/^(утас|phone)\s*[:：-]\s*/i, "");

    const phone = normalizePhone(phoneCandidate);

    if (/^\d{8,15}$/.test(phone)) {
      currentPhone = phone;
      return;
    }

    let parts = line.includes("\t")
      ? line.split("\t").map(x => x.trim())
      : line.includes(",")
        ? line.split(",").map(x => x.trim())
        : null;

    if (parts && parts.length >= 3) {
      const p = normalizePhone(parts[0]);
      const track = parts[1];
      const price = Number(
        parts.slice(2).join("").replace(/[,\s₮]/g, "")
      );

      if (p.length >= 8 && track &&
          Number.isFinite(price) && price >= 0) {
        valid.push({
          phone: p,
          track,
          price,
          date: currentDate
        });
      } else {
        invalid.push(index + 1);
      }
      return;
    }

    const match = line.match(
      /^(.*)\s*[-–—]\s*([\d,]+)\s*(?:₮)?$/
    );

    if (match && currentPhone) {
      const track = match[1].trim();
      const price = Number(match[2].replace(/,/g, ""));

      if (track && Number.isFinite(price) && price >= 0) {
        valid.push({
          phone: currentPhone,
          track,
          price,
          date: currentDate
        });
        return;
      }
    }

    invalid.push(index + 1);
  });

  return { valid, invalid };
}

$("previewBulkBtn").addEventListener("click", () => {
  const parsed = parseBulk($("bulkData").value);
  bulkList = parsed.valid;

  $("saveBulkBtn").disabled = bulkList.length === 0;

  if (!bulkList.length) {
    $("previewTable").innerHTML =
      '<p class="error">Зөв мэдээлэл олдсонгүй.</p>';
    return;
  }

  let html = `
    <p class="help">
      Зөв мөр: <b>${bulkList.length}</b>
      · Алдаатай мөр: <b>${parsed.invalid.length}</b>
    </p>
    <table>
      <thead>
        <tr>
          <th>#</th><th>Огноо</th><th>Утас</th>
          <th>Track</th><th>Үнэ</th>
        </tr>
      </thead>
      <tbody>
  `;

  bulkList.forEach((item, i) => {
    html += `
      <tr>
        <td>${i + 1}</td>
        <td>${safe(item.date || $("date").value)}</td>
        <td>${safe(item.phone)}</td>
        <td>${safe(item.track)}</td>
        <td>${money(item.price)}</td>
      </tr>
    `;
  });

  html += "</tbody></table>";

  if (parsed.invalid.length) {
    html += `<p class="error">Алдаатай мөр: ${parsed.invalid.join(", ")}</p>`;
  }

  $("previewTable").innerHTML = html;
});

$("saveBulkBtn").addEventListener("click", async () => {
  const date = $("date").value;

  if (!date || !bulkList.length) {
    toast("Мэдээллээ шалгана уу.");
    return;
  }

  if (!confirm(`${bulkList.length} ачаа хадгалах уу?`)) return;

  const updates = {};

  bulkList.forEach(item => {
    const key = db.ref("cargo").push().key;
    updates["cargo/" + key] = {
      ...item,
      date: item.date || date
    };
  });

  try {
    await db.ref().update(updates);
    toast(`${bulkList.length} ачаа хадгалагдлаа.`);
    $("bulkData").value = "";
    $("previewTable").innerHTML = "";
    bulkList = [];
    $("saveBulkBtn").disabled = true;
  } catch (error) {
    toast("Хадгалах алдаа: " + error.message);
  }
});

// ========================================
// ADMIN CARGO LIST
// ========================================

function startCargoListener() {
  if (listenerStarted) return;
  listenerStarted = true;

  db.ref("cargo").on("value", snapshot => {
    cargoCache = {};

    snapshot.forEach(child => {
      cargoCache[child.key] = child.val() || {};
    });

    renderCargo();
  }, error => {
    toast("Мэдээлэл унших алдаа: " + error.message);
  });
}

function renderCargo() {
  const entries = Object.entries(cargoCache);

  const total = entries.reduce(
    (sum, [, item]) => sum + (Number(item.price) || 0),
    0
  );

  $("totalCargo").textContent = entries.length.toLocaleString("mn-MN");
  $("totalIncome").textContent = money(total);

  const query = normalizeSearch($("filterInput").value);

  const filtered = entries.filter(([, item]) =>
    normalizeSearch(item.phone).includes(query) ||
    normalizeSearch(item.track).includes(query)
  ).reverse();

  $("cargoTable").innerHTML = filtered.length
    ? filtered.map(([key, item]) => `
      <tr>
        <td>${safe(item.date || "")}</td>
        <td>${safe(item.phone || "")}</td>
        <td>${safe(item.track || "")}</td>
        <td>${money(item.price)}</td>
        <td>
          <button class="action-btn"
            data-edit="${safe(key)}" type="button">Засах</button>
          <button class="action-btn delete-btn"
            data-delete="${safe(key)}" type="button">Устгах</button>
        </td>
      </tr>
    `).join("")
    : '<tr><td colspan="5" class="empty">Ачаа бүртгэгдээгүй байна.</td></tr>';
}

$("filterInput").addEventListener("input", renderCargo);

$("cargoTable").addEventListener("click", async event => {
  const editKey = event.target.dataset.edit;
  const deleteKey = event.target.dataset.delete;

  if (editKey) await editCargo(editKey);
  if (deleteKey) await deleteCargo(deleteKey);
});

// ========================================
// EDIT CARGO
// ========================================

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
  const normalized = normalizePhone(phone);

  if (
    !date.trim() ||
    normalized.length < 8 ||
    !track.trim() ||
    !Number.isFinite(price) ||
    price < 0
  ) {
    toast("Оруулсан мэдээлэл буруу байна.");
    return;
  }

  try {
    await db.ref("cargo/" + key).update({
      date: date.trim(),
      phone: normalized,
      track: track.trim(),
      price
    });

    toast("Ачааны мэдээлэл шинэчлэгдлээ.");
  } catch (error) {
    toast("Засах алдаа: " + error.message);
  }
}

// ========================================
// DELETE CARGO
// ========================================

async function deleteCargo(key) {
  if (!confirm("Энэ ачааг бүр мөсөн устгах уу?")) return;

  try {
    await db.ref("cargo/" + key).remove();
    toast("Ачаа устгагдлаа.");
  } catch (error) {
    toast("Устгах алдаа: " + error.message);
  }
}

// ========================================
// CUSTOMER PHONE SEARCH
// ========================================

$("searchForm").addEventListener("submit", async event => {
  event.preventDefault();

  const phone = normalizePhone($("searchTrack").value);

  if (phone.length < 8) {
    $("searchResult").innerHTML =
      '<p class="help">Утасны дугаараа зөв оруулна уу.</p>';
    return;
  }

  $("searchResult").innerHTML =
    '<p class="help">Таны бүх ачааг хайж байна...</p>';

  try {
    // Энгийн дугаар болон + тэмдэгтэй хадгалсан
    // дугааруудыг хоёуланг нь шалгана.
    const queries = await Promise.all([
      db.ref("cargo")
        .orderByChild("phone")
        .equalTo(phone)
        .once("value"),

      db.ref("cargo")
        .orderByChild("phone")
        .equalTo("+" + phone)
        .once("value")
    ]);

    // Давхардсан үр дүнг key-ээр нь ялгана.
    const foundMap = {};

    queries.forEach(snapshot => {
      snapshot.forEach(child => {
        foundMap[child.key] = child.val() || {};
      });
    });

    const found = Object.values(foundMap).filter(item =>
      normalizePhone(item.phone) === phone
    );

    if (found.length === 0) {
      $("searchResult").innerHTML = `
        <article class="result-card">
          <h3>Ачаа олдсонгүй.</h3>
          <p>Энэ утасны дугаарт бүртгэлтэй ачаа одоогоор алга байна.</p>
          <p>Утасны дугаараа шалгана уу.</p>
        </article>
      `;
      return;
    }

    // Нийт ачааны тоо болон нийт төлбөр
    const totalCargo = found.length;

    const totalPrice = found.reduce(
      (sum, item) => sum + (Number(item.price) || 0),
      0
    );

    // Огноогоор эрэмбэлнэ
    found.sort((a, b) =>
      String(b.date || "").localeCompare(String(a.date || ""))
    );

    $("searchResult").innerHTML = `
      <article class="result-card">

        <h2>✅ ${totalCargo} ачаа олдлоо</h2>

        <p>
          Утас: <b>${safe(phone)}</b>
        </p>

        <hr>

        <h3>Нийт ачаа: ${totalCargo} ширхэг</h3>

        <h2>Нийт төлбөр: ${money(totalPrice)}</h2>

      </article>

      ${found.map((item, index) => `
        <article class="result-card">

          <h3>📦 Ачаа ${index + 1}</h3>

          <p>
            <b>Ирсэн огноо:</b>
            ${safe(item.date || "Огноо байхгүй")}
          </p>

          <p>
            <b>Track code:</b>
            ${safe(item.track || "")}
          </p>

          <p>
            <b>Утас:</b>
            ${safe(item.phone || "")}
          </p>

          <p>
            <b>Төлбөр:</b>
            <strong>${money(item.price)}</strong>
          </p>

        </article>
      `).join("")}
    `;

  } catch (error) {
    $("searchResult").innerHTML =
      '<p class="error">Хайлт хийхэд алдаа гарлаа: ' +
      safe(error.message) + '</p>';
  }
});

// ========================================
// DEFAULT DATE
// ========================================

$("date").value = new Date().toLocaleDateString("en-CA");
