document.addEventListener("DOMContentLoaded", function () {
    const btn = document.getElementById("sendContactBtn");

    if (btn) {
        btn.addEventListener("click", function () {
            let name = document.getElementById("contactName").value.trim();
            let email = document.getElementById("contactEmail").value.trim();
            let message = document.getElementById("contactMessage").value.trim();

            // Validate basic
            if (name === "" || email === "" || message === "") {
                alert("⚠️ Vui lòng nhập đầy đủ thông tin!");
                return;
            }

            // Thông báo thành công
            alert("Gửi liên hệ thành công!");

            // Reset form
            document.getElementById("contactForm").reset();
        });
    }
});
