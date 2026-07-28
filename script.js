function checkCargo(){

let code = document.getElementById("code").value;

let result = document.getElementById("result");


if(code=="MIRA001"){

result.innerHTML =
"✅ Бараа: Гар цүнх<br>"+
"📦 Төлөв: Монголд ирсэн<br>"+
"💰 Төлбөр: 15,000₮";

}

else if(code=="MIRA002"){

result.innerHTML =
"✅ Бараа: Хувцас<br>"+
"📦 Төлөв: Замд явж байна<br>"+
"💰 Төлбөр: 20,000₮";

}

else{

result.innerHTML =
"❌ Ийм трак код олдсонгүй";

}

}
