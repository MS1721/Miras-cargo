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

const db = firebase.database();

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "Miras2026";

let bulkList = [];
let cargoListenerStarted = false;


/* =========================
   ADMIN LOGIN
========================= */

function login() {

    const username =
        document.getElementById("username").value.trim();

    const password =
        document.getElementById("password").value;

    if (
        username === ADMIN_USERNAME &&
        password === ADMIN_PASSWORD
    ) {

        document.getElementById("loginPage").style.display = "none";
        document.getElementById("adminPage").style.display = "block";

        loadCargo();

    } else {

        document.getElementById("loginError").innerText =
            "Нэвтрэх нэр эсвэл нууц үг буруу!";
    }
}


/* =========================
   LOGOUT
========================= */

function logout() {

    document.getElementById("loginPage").style.display = "block";
    document.getElementById("adminPage").style.display = "none";

    document.getElementById("username").value = "";
    document.getElementById("password").value = "";

    document.getElementById("loginError").innerText = "";
}


/* =========================
   ADD ONE CARGO
========================= */

function addCargo() {

    const date =
        document.getElementById("date").value.trim();

    const phone =
        document.getElementById("phone").value.trim();

    const track =
        document.getElementById("track").value.trim();

    const price =
        Number(document.getElementById("price").value);

    if (!date || !phone || !track || !price) {

        alert("Бүх мэдээллээ бөглөнө үү.");
        return;
    }

    const cargo = {
        date: date,
        phone: phone,
        track: track,
        price: price
    };

    const newRef = db.ref("cargo").push();

    newRef.set(cargo)
        .then(() => {

            alert("✅ Ачаа амжилттай хадгалагдлаа.");

            document.getElementById("phone").value = "";
            document.getElementById("track").value = "";
            document.getElementById("price").value = "";

        })
        .catch(error => {

            console.error(error);
            alert("❌ Хадгалахад алдаа гарлаа: " + error.message);
        });
}


/* =========================
   LOAD CARGO
========================= */

function loadCargo() {

    const table =
        document.getElementById("cargoTable");

    if (!table) return;

    if (cargoListenerStarted) return;

    cargoListenerStarted = true;

    db.ref("cargo").on("value", snapshot => {

        table.innerHTML = "";

        let totalCargo = 0;
        let totalIncome = 0;

        snapshot.forEach(child => {

            const id = child.key;
            const data = child.val();

            const price = Number(data.price) || 0;

            totalCargo++;
            totalIncome += price;

            table.innerHTML += `
                <tr>

                    <td>${escapeHTML(data.date || "")}</td>

                    <td>${escapeHTML(data.phone || "")}</td>

                    <td>${escapeHTML(data.track || "")}</td>

                    <td>
                        ${price.toLocaleString()}₮
                    </td>

                    <td>

                        <button onclick="editCargo('${id}')">
                            ✏️
                        </button>

                        <button onclick="deleteCargo('${id}')">
                            🗑️
                        </button>

                    </td>

                </tr>
            `;
        });

        document.getElementById("totalCargo").innerText =
            totalCargo;

        document.getElementById("totalIncome").innerText =
            totalIncome.toLocaleString() + "₮";
    });
}


/* =========================
   DELETE CARGO
========================= */

function deleteCargo(id) {

    const ok =
        confirm("Энэ ачааг устгах уу?");

    if (!ok) return;

    db.ref("cargo/" + id)
        .remove()
        .then(() => {

            alert("✅ Ачаа устгагдлаа.");

        })
        .catch(error => {

            alert(
                "❌ Устгахад алдаа гарлаа: " +
                error.message
            );
        });
}


/* =========================
   EDIT CARGO
========================= */

function editCargo(id) {

    db.ref("cargo/" + id)
        .once("value")
        .then(snapshot => {

            const data = snapshot.val();

            if (!data) {
                alert("Ачаа олдсонгүй.");
                return;
            }

            const newPrice =
                prompt(
                    "Шинэ үнэ:",
                    data.price
                );

            if (
                newPrice === null ||
                newPrice.trim() === ""
            ) {
                return;
            }

            const price =
                Number(newPrice);

            if (
                !Number.isFinite(price) ||
                price < 0
            ) {
                alert("Үнэ буруу байна.");
                return;
            }

            return db.ref("cargo/" + id)
                .update({
                    price: price
                });

        })
        .then(result => {

            if (result === undefined) return;

            alert("✅ Үнэ амжилттай шинэчлэгдлээ.");

        })
        .catch(error => {

            alert(
                "❌ Засахад алдаа гарлаа: " +
                error.message
            );
        });
}


/* =========================
   BULK PREVIEW
========================= */

function previewBulk() {

    bulkList = [];

    const text =
        document
            .getElementById("bulkData")
            .value
            .trim();

    if (!text) {

        alert("Track code-уудаа оруулна уу.");
        return;
    }

    const rows =
        text.split(/\r?\n/);

    let html = `
        <table>
            <tr>
                <th>№</th>
                <th>Утас</th>
                <th>Track</th>
                <th>Үнэ</th>
            </tr>
    `;

    let number = 0;

    rows.forEach(line => {

        line = line.trim();

        if (!line) return;

        const parts =
            line.split(/\s+/);

        /*
          FORMAT:

          УТАС TRACK ҮНЭ

          Жишээ:

          94791721 123456789 2000
        */

        if (parts.length < 3) return;

        const phone = parts[0];
        const track = parts[1];
        const price = Number(parts[2]);

        if (
            !phone ||
            !track ||
            !Number.isFinite(price)
        ) {
            return;
        }

        number++;

        bulkList.push({
            phone: phone,
            track: track,
            price: price
        });

        html += `
            <tr>
                <td>${number}</td>
                <td>${escapeHTML(phone)}</td>
                <td>${escapeHTML(track)}</td>
                <td>${price.toLocaleString()}₮</td>
            </tr>
        `;
    });

    html += "</table>";

    document.getElementById("previewTable").innerHTML =
        html;

    if (bulkList.length === 0) {

        alert(
            "Зөв форматтай мэдээлэл олдсонгүй.\n\n" +
            "Жишээ:\n" +
            "94791721 123456789 2000"
        );

        return;
    }

    alert(
        "📋 " +
        bulkList.length.toLocaleString() +
        " ачаа бэлэн боллоо."
    );
}


/* =========================
   BULK SAVE
========================= */

async function saveBulk() {

    const date =
        document.getElementById("date").value.trim();

    if (!date) {

        alert(
            "Эхлээд ачаа ирсэн огноогоо сонгоно уу."
        );

        return;
    }

    if (bulkList.length === 0) {

        alert(
            "Эхлээд Preview хийнэ үү."
        );

        return;
    }

    const confirmSave =
        confirm(
            bulkList.length.toLocaleString() +
            " ачааг " +
            date +
            " огноотой хадгалах уу?"
        );

    if (!confirmSave) return;

    try {

        /*
          Нэг бүрийг тусдаа push хийхийн оронд
          Firebase multi-location update ашиглана.
        */

        const updates = {};

        bulkList.forEach(item => {

            const key =
                db.ref("cargo").push().key;

            updates["cargo/" + key] = {

                date: date,

                phone: item.phone,

                track: item.track,

                price: Number(item.price)

            };
        });

        await db.ref().update(updates);

        alert(
            "✅ " +
            bulkList.length.toLocaleString() +
            " ачаа амжилттай хадгалагдлаа."
        );

        document.getElementById("bulkData").value = "";

        document.getElementById("previewTable").innerHTML = "";

        bulkList = [];

    }
    catch (error) {

        console.error(error);

        alert(
            "❌ Bulk хадгалахад алдаа гарлаа:\n" +
            error.message
        );
    }
}


/* =========================
   SEARCH TRACK
========================= */

function searchTrack() {

    const track =
        document
            .getElementById("searchTrack")
            .value
            .trim();

    if (!track) {

        alert("Track code оруулна уу.");
        return;
    }

    db.ref("cargo")
        .once("value")
        .then(snapshot => {

            let found = false;
            let html = "";

            snapshot.forEach(child => {

                const data = child.val();

                if (String(data.track) === track) {

                    found = true;

                    html += `
                        <div class="card">

                            <p>
                                <b>📅 Огноо:</b>
                                ${escapeHTML(data.date || "")}
                            </p>

                            <p>
                                <b>📱 Утас:</b>
                                ${escapeHTML(data.phone || "")}
                            </p>

                            <p>
                                <b>📦 Track:</b>
                                ${escapeHTML(data.track || "")}
                            </p>

                            <p>
                                <b>💰 Үнэ:</b>
                                ${(Number(data.price) || 0)
                                    .toLocaleString()}₮
                            </p>

                        </div>
                    `;
                }
            });

            if (!found) {

                html =
                    "<p>❌ Track code олдсонгүй.</p>";
            }

            document.getElementById("searchResult").innerHTML =
                html;
        })
        .catch(error => {

            alert(
                "❌ Хайхад алдаа гарлаа: " +
                error.message
            );
        });
}


/* =========================
   SECURITY HELPER
========================= */

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

