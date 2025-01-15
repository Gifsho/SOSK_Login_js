const predefinedUsername = "test"; // ชื่อผู้ใช้ที่ตั้งไว้
const predefinedPassword = "1234"; // รหัสผ่านที่ตั้งไว้

function generateRandomKey() {
  return CryptoJS.lib.WordArray.random(16); // สุ่มคีย์ 128 บิต
}

function encryptText(text, key, iv) {
  const encrypted = CryptoJS.AES.encrypt(text, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });

  return encrypted.toString();
}

function decryptText(encryptedText, key, iv) {
  const bytes = CryptoJS.AES.decrypt(encryptedText, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });

  return bytes.toString(CryptoJS.enc.Utf8);
}

async function login(event) {
  event.preventDefault();

  const Username = document.getElementById("u___n___").value;
  const Password = document.getElementById("p___w___").value;

  // สุ่มคีย์และ IV ใหม่สำหรับแต่ละการเข้ารหัส
  const encryptionKey = generateRandomKey();
  const iv = CryptoJS.lib.WordArray.random(16);

  const encryptedUsername = encryptText(Username, encryptionKey, iv);
  const encryptedPassword = encryptText(Password, encryptionKey, iv);

  // ส่งคำขอไปยัง API
  const response = await fetch('https://logintest-gxrh.onrender.com/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      username: encryptedUsername,
      password: encryptedPassword
    })
  });

  const result = await response.json();

  if (result.success) {
    alert("เข้าสู่ระบบสำเร็จ");
    localStorage.setItem("token", result.token); // ใช้ token ที่ได้รับจาก API
    location.reload();
  } else {
    alert("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const loginButton = document.getElementById("login-button");
  loginButton.addEventListener("click", login);
});
