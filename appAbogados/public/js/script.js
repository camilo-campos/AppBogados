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

    // Get unique regions and sort them alphabetically
    const regions = regionOrganize(data);
    regions.forEach((region) => {
      const option = document.createElement("option");
      option.value = region;
      option.textContent = region;
      regionSelect.appendChild(option);
    });

    regionSelect.addEventListener("change", () => {
      const selectedRegion = regionSelect.value;
      comunaSelect.innerHTML = ""; // Clear previous options
      const comunas = comunaOrganize(data, selectedRegion);
      comunas.forEach((comuna) => {
        const option = document.createElement("option");
        option.value = comuna.comuna;
        option.textContent = comuna.comuna;
        comunaSelect.appendChild(option);
      });
    });

    // Trigger change event to populate the initial list of comunas
    const event = new Event("change");
    regionSelect.dispatchEvent(event);
  }
});

function regionOrganize(data) {
  // Get unique regions and sort them alphabetically
    let regions = [...new Set(data.map((item) => item.region))].sort();
    // Find 'Metropolitana de Santiago' and move it to the beginning of the list
    const metropolitanaIndex = regions.findIndex(
      (region) => region.trim() === "Metropolitana de Santiago"
    );
    if (metropolitanaIndex !== -1) {
      regions = [
        regions[metropolitanaIndex],
        ...regions.slice(0, metropolitanaIndex),
        ...regions.slice(metropolitanaIndex + 1),
      ];
    }
  
    return regions;
  }
  
  function comunaOrganize(data, selectedRegion) {
    let comunas = data.filter(
      (item) => item.region === selectedRegion
    );
  
    // Sort comunas alphabetically
    comunas.sort((a, b) => a.comuna.localeCompare(b.comuna));
  
    // If selectedRegion is 'Metropolitana de Santiago', move 'Santiago' to the beginning of the list
    const santiagoIndex = comunas.findIndex(
      (comuna) => comuna.comuna === "Santiago"
    );
    if (santiagoIndex !== -1) {
      comunas = [
        comunas[santiagoIndex],
        ...comunas.slice(0, santiagoIndex),
        ...comunas.slice(santiagoIndex + 1),
      ];
    }
  
    return comunas;
  }

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
      } else {


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

        document.getElementById("cliente-form").reset();

        document.getElementById("success-image").style.display = "block";
        document
          .getElementById("success-image")
          .scrollIntoView({ behavior: "smooth" });

        // Esperar 3 segundos y luego redirigir a otra página
        setTimeout(() => {
          window.location.href = "/success"; // Cambia "/gracias" por la ruta de la página de destino
        }, 3000);
        console.log("Datos insertados en la base de datos correctamente");






      }

      // Redirigir después de la inserción exitosa
    } catch (error) {
      console.error("Error:", error);
      alert(
        "Hubo un problema al procesar la solicitud. Por favor, inténtelo de nuevo."
      );
    }
  });
