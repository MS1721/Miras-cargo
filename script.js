// ===== MIRAS CARGO =====

// Жишээ өгөгдөл (дараа нь Firebase-р солигдоно)
const cargoData = [
    {
        phone: "94791721",
        track: "CN1721001",
        product: "Пүүз",
        price: "28,000₮",
        status: "Ирсэн"
    },
    {
        phone: "94791721",
        track: "CN1721002",
        product: "Цүнх",
        price: "15,000₮",
        status: "Замд"
    },
    {
        phone: "85290553",
        track: "CN1721003",
        product: "Хувцас",
        price: "32,000₮",
        status: "Ирсэн"
    }
];

// Бараа хайх
function searchCargo() {

    const phone = document.getElementById("phone").value.trim();
    const result = document.getElementById("result");

    result.innerHTML = "";

    if(phone===""){
        alert("Утасны дугаараа оруулна уу.");
        return;
    }

    const list = cargoData.filter(item => item.phone === phone);

    if(list.length===0){

        result.innerHTML=`
        <div class="card">
        <h3>❌ Мэдээлэл олдсонгүй.</h3>
        </div>
        `;

        return;
    }

    let html=`
    <div class="card">
    <h2>📦 Таны бараанууд</h2>

    <table>

    <tr>
    <th>Трак код</th>
    <th>Бараа</th>
    <th>Үнэ</th>
    <th>Төлөв</th>
    </tr>
    `;

    list.forEach(item=>{

        html+=`
        <tr>
        <td>${item.track}</td>
        <td>${item.product}</td>
        <td>${item.price}</td>
        <td>${item.status}</td>
        </tr>
        `;

    });

    html+=`</table></div>`;

    result.innerHTML=html;

}


// Хятад хаяг хуулах

function copyAddress(){

const text=`
豪毕图1721
17548940432
内蒙古自治区
锡林郭勒盟
二连浩特市
环宇商贸城西区5号楼13阿古拉百货商铺1721（94791721）
`;

navigator.clipboard.writeText(text);

alert("✅ Хаяг амжилттай хууллаа.");

}
