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
let especialidades = [];

document.addEventListener("DOMContentLoaded", () => {
  fetch("/js/ambitos.json")
    .then((response) => response.json())
    .then((data) => {
      especialidades = data;
    })
    .catch((error) => {
      console.error("Error fetching especialidades JSON:", error);
    });

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
    const regionSelect = document.getElementById("region");
    const comunaSelect = document.getElementById("comuna");

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

document.addEventListener("DOMContentLoaded", () => {
  // Obtener el CSRF token
  fetch("/csrf-token")
    .then((response) => response.json())
    .then((data) => {
      document.getElementById("csrf-token").value = data.csrfToken;
    })
    .catch((error) => {
      console.error("Error fetching CSRF token:", error);
    });

  // Configurar el slider
  const slider = document.getElementById("nivel_coincidencia");
  const output = document.getElementById("valor_nivel_coincidencia");

  // Actualizar el valor mostrado cuando se carga la página
  if (slider) {
    output.textContent = slider.value;
    slider.addEventListener("input", function () {
      output.textContent = slider.value;
    });
  }
});

// Función para validar los campos del formulario y devolver mensajes de error específicos
function validateForm() {
  const errors = [];

  const name = document.getElementById("nombre").value.trim();
  const rut = document.getElementById("rut").value.trim();
  const apellidos = document.getElementById("apellidos").value.trim();
  const mail = document.getElementById("mail").value.trim();
  const telefono = document.getElementById("telefono").value.trim();
  const costo_ser_primer_adelant = document.querySelector(
    'input[name="costo_ser_primer_adelant"]:checked'
  )?.value;
  const costo_ser_cuota_litis = document.querySelector(
    'input[name="costo_ser_cuota_litis"]:checked'
  )?.value;
  const costo_ser_gastos_tramitacion = document.querySelector(
    'input[name="costo_ser_gastos_tramitacion"]:checked'
  )?.value;
  const horario_at_dias_hab = document.querySelector(
    'input[name="horario_at_dias_hab"]:checked'
  )?.value;
  const horario_at_horas_hab = document.querySelector(
    'input[name="horario_at_horas_hab"]:checked'
  )?.value;
  const req_cliente_sin_ant_penales = document.querySelector(
    'input[name="req_cliente_sin_ant_penales"]:checked'
  )?.value;
  const req_cliente_sin_ant_com = document.querySelector(
    'input[name="req_cliente_sin_ant_com"]:checked'
  )?.value;
  const req_cliente_residencia_regular = document.querySelector(
    'input[name="req_cliente_residencia_regular"]:checked'
  )?.value;
  const nivel_coincidencia = document
    .getElementById("nivel_coincidencia")
    ?.value.trim();
  const descripcion = document.getElementById("descripcion").value.trim();
  const region = document.getElementById("region").value.trim();
  const comuna = document.getElementById("comuna").value.trim();
  const selectedSpecialties = document.querySelectorAll(
    'input[name="especialidad"]:checked'
  );

  if (!name) errors.push("Nombre es obligatorio.");
  if (!rut) errors.push("RUT es obligatorio.");
  if (!apellidos) errors.push("Apellidos son obligatorios.");
  if (!mail) errors.push("Correo electrónico es obligatorio.");
  if (!telefono) errors.push("Teléfono es obligatorio.");
  if (!costo_ser_primer_adelant)
    errors.push("Debe seleccionar el costo por ser primer adelantado.");
  if (!costo_ser_cuota_litis)
    errors.push("Debe seleccionar el costo por cuota litis.");
  if (!costo_ser_gastos_tramitacion)
    errors.push("Debe seleccionar el costo por gastos de tramitación.");
  if (!horario_at_dias_hab)
    errors.push("Debe seleccionar el horario de atención en días hábiles.");
  if (!horario_at_horas_hab)
    errors.push("Debe seleccionar el horario de atención en horas hábiles.");
  if (!req_cliente_sin_ant_penales)
    errors.push(
      "Debe seleccionar el requerimiento de cliente sin antecedentes penales."
    );
  if (!req_cliente_sin_ant_com)
    errors.push(
      "Debe seleccionar el requerimiento de cliente sin antecedentes comerciales."
    );
  if (!req_cliente_residencia_regular)
    errors.push("Debe seleccionar el requerimiento de residencia regular.");
  if (!nivel_coincidencia) errors.push("Nivel de coincidencia es obligatorio.");
  if (!descripcion) errors.push("Descripción es obligatoria.");
  if (!region) errors.push("Región es obligatoria.");
  if (!comuna) errors.push("Comuna es obligatoria.");
  if (selectedSpecialties.length === 0)
    errors.push("Debe seleccionar al menos una especialidad.");

  return errors;
}

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
  .getElementById("abogado-form")
  .addEventListener("submit", async function (event) {
    event.preventDefault(); // Evita el envío del formulario por defecto

    // Cargar el JSON y validar el formulario

    const errors = validateForm();

    if (errors.length > 0) {
      alert("Errores en el formulario:\n" + errors.join("\n"));
      return;
    }

    // Captura los valores del formulario
    const name = document.getElementById("nombre").value.trim();
    let rut = document.getElementById("rut").value.trim();
    const apellidos = document.getElementById("apellidos").value.trim();
    const mail = document.getElementById("mail").value.trim();
    const telefono = document.getElementById("telefono").value.trim();
    const costo_ser_primer_adelant = document.querySelector(
      'input[name="costo_ser_primer_adelant"]:checked'
    )?.value;
    const costo_ser_cuota_litis = document.querySelector(
      'input[name="costo_ser_cuota_litis"]:checked'
    )?.value;
    const costo_ser_gastos_tramitacion = document.querySelector(
      'input[name="costo_ser_gastos_tramitacion"]:checked'
    )?.value;
    const horario_at_dias_hab = document.querySelector(
      'input[name="horario_at_dias_hab"]:checked'
    )?.value;
    const horario_at_horas_hab = document.querySelector(
      'input[name="horario_at_horas_hab"]:checked'
    )?.value;
    const req_cliente_sin_ant_penales = document.querySelector(
      'input[name="req_cliente_sin_ant_penales"]:checked'
    )?.value;
    const req_cliente_sin_ant_com = document.querySelector(
      'input[name="req_cliente_sin_ant_com"]:checked'
    )?.value;
    const req_cliente_residencia_regular = document.querySelector(
      'input[name="req_cliente_residencia_regular"]:checked'
    )?.value;
    const nivel_coincidencia = document
      .getElementById("nivel_coincidencia")
      ?.value.trim();
    const descripcion = document.getElementById("descripcion").value.trim();
    const region = document.getElementById("region").value.trim();
    const comuna = document.getElementById("comuna").value.trim();
    const selectedSpecialties = document.querySelectorAll(
      'input[name="especialidad"]:checked'
    );
    const selectedSpecialtyValues = Array.from(selectedSpecialties).map(
      (checkbox) => checkbox.value
    );

    // Formatear el RUT (eliminar puntos)
    rut = rut.replace(/\./g, "");

    // Generar objeto de datos para la solicitud
    const dataToSend = {
      formType: "abogado",
      rut: rut,
      nombre: name,
      apellidos: apellidos,
      mail: mail,
      telefono: telefono,
      costo_ser_primer_adelant: costo_ser_primer_adelant,
      costo_ser_cuota_litis: costo_ser_cuota_litis,
      costo_ser_gastos_tramitacion: costo_ser_gastos_tramitacion,
      horario_at_dias_hab: horario_at_dias_hab,
      horario_at_horas_hab: horario_at_horas_hab,
      req_cliente_sin_ant_penales: req_cliente_sin_ant_penales,
      req_cliente_sin_ant_com: req_cliente_sin_ant_com,
      req_cliente_residencia_regular: req_cliente_residencia_regular,
      nivel_coincidencia: nivel_coincidencia,
      descripcion: descripcion,
      region: region,
      comuna: comuna,
      especialidades: selectedSpecialtyValues,
    };

    try {
      const response = await fetch("/submit-form", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "CSRF-Token": document.getElementById("csrf-token").value,
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        // if the response is: "Lawyer not found in PJUD database", show an alert
        const data = await response.json();
        if (data.error === "Lawyer not found in PJUD database") {
          alert(
            "El abogado no se encuentra en la base de datos del PJUD. Por favor, verifique el RUT ingresado."
          );
          return;
        }


        throw new Error("Network response was not ok");
      }

      document.getElementById("abogado-form").reset();

      document.getElementById("success-image").style.display = "block";
      document
        .getElementById("success-image")
        .scrollIntoView({ behavior: "smooth" });

      // Esperar 3 segundos y luego redirigir a otra página
      setTimeout(() => {
        window.location.href = "/registro"; // Cambia "/gracias" por la ruta de la página de destino
      }, 3000);
    } catch (error) {
      console.error("Error:", error);
    }
  });
