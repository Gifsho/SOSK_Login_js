const encryptionKey = CryptoJS.enc.Utf8.parse("1234567890123456");
const iv = CryptoJS.enc.Utf8.parse("1234567890123456");

function encryptText(text) {
  return CryptoJS.AES.encrypt(text, encryptionKey, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  }).toString();
}

async function login(event) {
  event.preventDefault();

  const Username = document.getElementById("u___n___").value;
  const Password = document.getElementById("p___w___").value;

  const encryptedUsername = encryptText(Username);
  const encryptedPassword = encryptText(Password);

  const loginData = {
    u___n___: encryptedUsername,
    p___w___: encryptedPassword,
  };

  try {
    const response = await fetch('https://logintest-gxrh.onrender.com/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData),
    });

    const data = await response.json();

    if (data.token) {
      alert("เข้าสู่ระบบสำเร็จ");
      localStorage.setItem("token", data.token);
      location.reload();
      console.log(loginData);
    } else {
      alert(data.message || "เกิดข้อผิดพลาด");
      location.reload();
    }
  } catch (error) {
    alert("เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์");
    console.error("Error:", error);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const loginButton = document.getElementById("login-button");
  loginButton.addEventListener("click", login);
});
