MIRA'S CARGO — ҮНЭГҮЙ WEBSITE (ХЭРЭГЛЭГЧ + АДМИН)

Файлууд:
- index.html — хэрэглэгчийн ачаа шалгах хуудас
- admin.html — админы удирдлагын хэсэг
- style.css — iPhone-д тохирсон цэнхэр/цагаан загвар
- script.js — админы ажиллагаа
- database.rules.json — Firebase хамгаалалтын дүрэм

ХЭРЭГЛЭГЧИЙН ХАЙЛТ:
- Хэрэглэгч утасны дугаар + Track code хоёуланг нь оруулж шалгана.
- Хоёр утга таарсан үед л тухайн ачааны огноо, Track code, төлбөр гарна.
- Firebase-ийн public read нь зөвхөн composite searchKey-ийн яг тэнцүү хайлтаар хязгаарлагдсан. Бүх cargo санг нийтэд уншуулахгүй.

АДМИНЫ ХАМГААЛАЛТ:
1. Firebase Console → Authentication → Sign-in method → Email/Password идэвхжүүл.
2. Authentication → Users дээр өөрийн админ хэрэглэгчийг үүсгэ.
3. Users жагсаалтаас өөрийн хэрэглэгчийн UID-г хуул.
4. script.js доторх ADMIN_UID = "PASTE_YOUR_ADMIN_UID_HERE" хэсэгт UID-г тавь.
5. database.rules.json доторх PASTE_YOUR_ADMIN_UID_HERE гэсэн хоёр хэсэгт ижил UID-г тавь.
6. Realtime Database → Rules хэсэгт шинэ database.rules.json дүрмийг оруулж Publish дар.

ХУУЧИН МЭДЭЭЛЭЛ:
- Өмнө бүртгэсэн ачаануудад phone талбар зөв хадгалагдсан бол хэрэглэгчийн утасны дугаараар хайлт ажиллана.

ҮНЭГҮЙ БАЙРШУУЛАХ:
1. GitHub repository-ийн хуучин index.html, admin.html, style.css, script.js файлуудаа эхлээд нөөцөл.
2. Энэ багцын файлуудыг repository-ийн үндсэн хавтас руу хуулж байрлуул.
3. Firebase Spark төлөвлөгөөг ашиглаж болно. Firebase-ийн тухайн үеийн үнэгүй хэрэглээний хязгаарыг хэтрүүлэхгүй байх.
4. GitHub Pages-ийг Settings → Pages хэсгээс идэвхжүүл.
5. Хэрэглэгчийн хуудас: https://ТАНЫ-GITHUB-НЭР.github.io/ТАНЫ-REPO/
6. Админ хуудас: https://ТАНЫ-GITHUB-НЭР.github.io/ТАНЫ-REPO/admin.html

АНХААРУУЛГА:
- Домэйн, Firebase-ийн хэрэглээний хязгаар давсан төлбөртэй үйлчилгээ, нэмэлт үйлчилгээ зэргийг сонгохгүй бол GitHub Pages + Firebase Spark-аар сарын төлбөргүй ашиглах боломжтой.
- Хуучин admin нууц үгийг бүү ашигла. Firebase Authentication дээр шинэ нууц үг үүсгэ.
- UID болон нууц үгээ олон нийтэд бүү тавь. Нууц үгээ чат руу явуулах шаардлагагүй.
- Firebase Rules дотор UID-г заавал өөрийн UID-гаар солино. Placeholder үлдвэл зөвхөн UID-г тохируулсны дараа админ бүрэн ажиллана.
