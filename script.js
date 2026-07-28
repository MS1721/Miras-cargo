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

function login() {

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {

        document.getElementById("loginPage").style.display = "none";
        document.getElementById("adminPage").style.display = "block";

        loadCargo();

    } else {

        document.getElementById("loginError").innerHTML =
        "Нэвтрэх нэр эсвэл нууц үг буруу!";

    }

}

function logout() {

    document.getElementById("loginPage").style.display = "block";
    document.getElementById("adminPage").style.display = "none";

    document.getElementById("username").value = "";
    document.getElementById("password").value = "";
    document.getElementById("loginError").innerHTML = "";

}
function addCargo() {

    const date = document.getElementById("date").value;
    const phone = document.getElementById("phone").value.trim();
    const track = document.getElementById("track").value.trim();
    const price = document.getElementById("price").value;

    if (!date || !phone || !track || !price) {
        alert("Бүх мэдээллээ бөглөнө үү.");
        return;
    }

    const cargo = {
        date: date,
        phone: phone,
        track: track,
        price: Number(price)
    };

    db.ref("cargo").push(cargo)
    .then(() => {

        alert("Амжилттай хадгаллаа.");

        document.getElementById("phone").value = "";
        document.getElementById("track").value = "";
        document.getElementById("price").value = "";

        loadCargo();

    })
    .catch(error => {

        alert(error.message);

    });

}
function loadCargo() {

    const table = document.getElementById("cargoTable");

    table.innerHTML = "";

    let totalCargo = 0;
    let totalIncome = 0;

    db.ref("cargo").on("value", (snapshot) => {

        table.innerHTML = "";

        totalCargo = 0;
        totalIncome = 0;

        snapshot.forEach((child) => {

            const key = child.key;
            const data = child.val();

            totalCargo++;
            totalIncome += Number(data.price);

            table.innerHTML += `
                <tr>
                    <td>${data.date}</td>
                    <td>${data.phone}</td>
                    <td>${data.track}</td>
                    <td>${Number(data.price).toLocaleString()}₮</td>
                    <td>
                        <button onclick="editCargo('${key}')">✏️</button>
                        <button onclick="deleteCargo('${key}')">🗑️</button>
                    </td>
                </tr>
            `;

        });

        document.getElementById("totalCargo").innerHTML = totalCargo;
        document.getElementById("totalIncome").innerHTML =
            totalIncome.toLocaleString() + "₮";

    });

}
function deleteCargo(id) {

    const ok = confirm("Энэ ачааг устгах уу?");

    if (!ok) return;

    db.ref("cargo/" + id)
        .remove()
        .then(() => {

            alert("Амжилттай устгалаа.");

        })
        .catch((error) => {

            alert(error.message);

        });

}
function editCargo(id) {

    const newPrice = prompt("Шинэ үнийг оруулна уу");

    if (newPrice === null || newPrice === "") return;

    db.ref("cargo/" + id)
    .update({
        price: Number(newPrice)
    })
    .then(() => {

        alert("Амжилттай шинэчлэгдлээ.");

    })
    .catch((error) => {

        alert(error.message);

    });

}
let bulkList = [];

function previewBulk() {

    bulkList = [];

    const text = document
        .getElementById("bulkData")
        .value
        .trim();

    const rows = text.split("\n");

    let html = `
    <table>
    <tr>
        <th>Утас</th>
        <th>Track</th>
        <th>Үнэ</th>
    </tr>
    `;

    rows.forEach(line => {

        const parts = line.trim().split(/\s+/);

        if (parts.length < 3) return;

        const phone = parts[0];
        const track = parts[1];
        const price = Number(parts[2]);

        bulkList.push({
            phone,
            track,
            price
        });

        html += `
        <tr>
            <td>${phone}</td>
            <td>${track}</td>
            <td>${price.toLocaleString()}₮</td>
        </tr>
        `;

    });

    html += "</table>";

    document.getElementById("previewTable").innerHTML = html;

}
function saveBulk() {

    const date = document.getElementById("date").value;

    if (!date) {
        alert("Эхлээд огноо сонгоно уу.");
        return;
    }

    if (bulkList.length === 0) {
        alert("Preview хийсний дараа хадгална.");
        return;
    }

    let promises = [];

    bulkList.forEach(item => {

        const cargo = {
            date: date,
            phone: item.phone,
            track: item.track,
            price: item.price
        };

        promises.push(
            db.ref("cargo").push(cargo)
        );

    });

    Promise.all(promises)
    .then(() => {

        alert("Бүх ачаа амжилттай хадгалагдлаа.");

        document.getElementById("bulkData").value = "";
        document.getElementById("previewTable").innerHTML = "";

        bulkList = [];

        loadCargo();

    })
    .catch((error) => {

        alert(error.message);

    });

}
function searchTrack() {

    const track = document
        .getElementById("searchTrack")
        .value
        .trim();

    if (track === "") {

        alert("Track code оруулна уу.");

        return;

    }

    db.ref("cargo")
    .once("value")
    .then((snapshot) => {

        let found = false;

        let html = "";

        snapshot.forEach((child) => {

            const data = child.val();

            if (data.track === track) {

                found = true;

                html = `
                <div class="card">

                <p><b>📅 Огноо:</b> ${data.date}</p>

                <p><b>📱 Утас:</b> ${data.phone}</p>

                <p><b>📦 Track:</b> ${data.track}</p>

                <p><b>💰 Үнэ:</b>
                ${Number(data.price).toLocaleString()}₮
                </p>

                </div>
                `;

            }

        });

        if (!found) {

            html =
            "<p>❌ Track code олдсонгүй.</p>";

        }

        document.getElementById("searchResult").innerHTML = html;

    });

}
