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

document
  .getElementById("abogado-form")
  .addEventListener("submit", async function (event) {
    event.preventDefault(); // Evita el envío del formulario por defecto

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
      ?.value.trim(); // Asegúrate de que el slider exista
    const descripcion = document.getElementById("descripcion").value.trim();
    const territorio = document.getElementById("territorio").value.trim();
    const tipo_territorio = document
      .getElementById("tipo_territorio")
      .value.trim();

    // Validación de datos
    if (
      !name ||
      !rut ||
      !apellidos ||
      !mail ||
      !telefono ||
      !costo_ser_primer_adelant ||
      !costo_ser_cuota_litis ||
      !costo_ser_gastos_tramitacion ||
      !horario_at_dias_hab ||
      !horario_at_horas_hab ||
      !req_cliente_sin_ant_penales ||
      !req_cliente_sin_ant_com ||
      !req_cliente_residencia_regular ||
      !nivel_coincidencia ||
      !descripcion ||
      !territorio ||
      !tipo_territorio
    ) {
      alert("Todos los campos son obligatorios.");
      return;
    }

    // Formatear el RUT (eliminar puntos)
    rut = rut.replace(/\./g, "");

    // Generar objeto de datos para la solicitud
    const dataToSend = {
      formType: "abogado", // Tipo de formulario específico para abogado
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
      territorio: territorio,
      tipo_territorio: tipo_territorio,
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
        throw new Error("Network response was not ok");
      }

      const data = await response.json();
      console.log("Éxito:", data);
      window.location.href = "/registro";
    } catch (error) {
      console.error("Error:", error);
    }
  });
