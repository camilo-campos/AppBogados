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

    const regions = [...new Set(data.map((item) => item.desc_region))];
    regions.forEach((region) => {
      const option = document.createElement("option");
      option.value = region;
      option.textContent = region;
      regionSelect.appendChild(option);
    });

    regionSelect.addEventListener("change", () => {
      const selectedRegion = regionSelect.value;
      const comunas = data.filter(
        (item) => item.desc_region === selectedRegion
      );
      comunaSelect.innerHTML = ""; // Clear previous options

      comunas.forEach((comuna) => {
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

    const regions = [...new Set(data.map((item) => item.desc_region))];
    regions.forEach((region) => {
      const option = document.createElement("option");
      option.value = region;
      option.textContent = region;
      regionSelect.appendChild(option);
    });

    regionSelect.addEventListener("change", () => {
      const selectedRegion = regionSelect.value;
      const comunas = data.filter(
        (item) => item.desc_region === selectedRegion
      );
      comunaSelect.innerHTML = ""; // Clear previous options

      comunas.forEach((comuna) => {
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
  .addEventListener("submit", async function (event) {
    event.preventDefault();

    // Recopilar datos del formulario
    const name = document.getElementById("name").value.trim();
    let rut = document.getElementById("rut").value.trim();
    const Apellidos = document.getElementById("Apellidos").value.trim();
    const email = document.getElementById("email").value.trim();
    const Region = document.getElementById("Region").value.trim();
    const Comuna = document.getElementById("Comuna").value.trim();
    const Problema = document.getElementById("Problema").value.trim();
    const antecedentes_penales = document.querySelector(
      'input[name="antecedentes_penales"]:checked'
    ).value;
    const antecedentes_comerciales = document.querySelector(
      'input[name="antecedentes_comerciales"]:checked'
    ).value;
    const residencia = document.querySelector(
      'input[name="residencia"]:checked'
    ).value;

    // Validar campos
    if (
      !name ||
      !rut ||
      !Apellidos ||
      !email ||
      !Region ||
      !Comuna ||
      !Problema ||
      !antecedentes_penales ||
      !antecedentes_comerciales ||
      !residencia
    ) {
      alert("Todos los campos son obligatorios.");
      return;
    }
    const formType = "cliente";
    // Generar objeto de datos para la primera solicitud
    const formDataForFirstRequest = {
      formType,
      name,
      rut,
      Apellidos,
      email,
      Region,
      Comuna,
      Problema,
      antecedentes_penales,
      antecedentes_comerciales,
      residencia,
    };

    // Crear objeto de datos para la segunda solicitud
    const id_solicitud = uuid.v1(); // Genera un UUID v1
    const formDataForSecondRequest = {
      id_solicitud,
      nombre: name,
      rut: rut.replace(/\./g, ""), // Eliminar puntos del RUT
      apellidos: Apellidos,
      mail: email,
      region: Region,
      comuna: Comuna,
      caso: Problema,
      antecedentes_penales: antecedentes_penales === "si" ? 1 : 0,
      antecedentes_comerciales: antecedentes_comerciales === "si" ? 1 : 0,
      residencia: residencia === "si" ? 1 : 0,
    };

    try {
      // Enviar datos al endpoint /submit-db si la primera solicitud fue exitosa
      const responseDB = await fetch("/submit-db", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "CSRF-Token": document.getElementById("csrf-token").value,
        },
        body: JSON.stringify(formDataForSecondRequest),
      });

      if (!responseDB.ok) {
        throw new Error("Error al insertar los datos en la base de datos");
      }

      console.log("Datos insertados en la base de datos correctamente");
      // Enviar datos al endpoint /submit-form
      const responseForm = await fetch("/submit-form", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "CSRF-Token": document.getElementById("csrf-token").value,
        },
        body: JSON.stringify(formDataForFirstRequest),
      });

      if (!responseForm.ok) {
        throw new Error("Error al enviar el formulario");
      }

      // Redirigir después de la inserción exitosa
    } catch (error) {
      console.error("Error:", error);
      alert(
        "Hubo un problema al procesar la solicitud. Por favor, inténtelo de nuevo."
      );
    }
  });
