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

document.addEventListener("DOMContentLoaded", () => {
  fetch("/csrf-token")
    .then((response) => response.json())
    .then((data) => {
      document.getElementById("csrf-token").value = data.csrfToken;
    })
    .catch((error) => {
      console.error("Error fetching CSRF token:", error);
    });

  fetch("/js/comunas.json")
    .then((response) => response.json())
    .then((data) => {
      populateRegionAndComuna(data);
    })
    .catch((error) => {
      console.error("Error fetching comunas JSON:", error);
    });

  function populateRegionAndComuna(data) {
    const regionSelect = document.getElementById("Region");
    const comunaSelect = document.getElementById("Comuna");

    const regions = [...new Set(data.map(item => item.desc_region))];
    regions.forEach(region => {
      const option = document.createElement("option");
      option.value = region;
      option.textContent = region;
      regionSelect.appendChild(option);
    });

    regionSelect.addEventListener("change", () => {
      const selectedRegion = regionSelect.value;
      const comunas = data.filter(item => item.desc_region === selectedRegion);
      comunaSelect.innerHTML = "";  // Clear previous options

      comunas.forEach(comuna => {
        const option = document.createElement("option");
        option.value = comuna.desc_comuna;
        option.textContent = comuna.desc_comuna;
        comunaSelect.appendChild(option);
      });
    });

    // Trigger change event to populate the initial list of comunas
    const event = new Event("change");
    regionSelect.dispatchEvent(event);
  }
});

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
      headers: { 
        "Content-Type": "application/json",
        "CSRF-Token": document.getElementById("csrf-token").value  // Add the CSRF token to the headers
      },
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
