//document.addEventListener("DOMContentLoaded", () => {
//  console.log("JavaScript cargado y listo.");
//
//  fetch("/csrf-token")
//    .then((response) => response.json())
//    .then((data) => {
//      document.getElementById("csrf-token").value = data.csrfToken;
//    })
//    .catch((error) => {
//      console.error("Error fetching CSRF token:", error);
//    });
//});

document
  .getElementById("cliente-form")
  .addEventListener("submit", function (event) {
    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const Apellidos = document.getElementById("Apellidos").value.trim();
    const email = document.getElementById("email").value.trim();
    const Region = document.getElementById("Region").value.trim();
    const Comuna = document.getElementById("Comuna").value.trim();
    const Problema = document.getElementById("Problema").value.trim();

    if (!name || !Apellidos || !email || !Region || !Comuna || !Problema) {
      alert("Todos los campos son obligatorios.");
      return;
    }

    // Enviar formulario
    const formData = new FormData(event.target);
    const plainFormData = Object.fromEntries(formData.entries());
    const formJson = JSON.stringify(plainFormData);

    fetch("/submit-form", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: formJson,
    })
      .then((response) => {
        if (response.ok) {
          window.location.href = "/success";
        } else {
          console.error("Error al enviar el formulario");
        }
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  });
