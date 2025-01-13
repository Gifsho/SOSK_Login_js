<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $username = $_POST['u___n___'];
    $hashedPassword = $_POST['p___w___'];

    // ตัวอย่างการตรวจสอบชื่อผู้ใช้และรหัสผ่านที่แฮชแล้ว
    $valid_username = "1";
    $valid_hashedPassword = hash('sha256', '1'); // แฮชรหัสผ่านที่ถูกต้อง

    if ($username == $valid_username && $hashedPassword == $valid_hashedPassword) {
        echo "success";
    } else {
        echo "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง!";
    }
}
?>
