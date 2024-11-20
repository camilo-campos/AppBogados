document.addEventListener("DOMContentLoaded", () => {
  fetch("/csrf-token")
    .then((response) => response.json())
    .then((data) => {
      document.getElementById("csrf-token").value = data.csrfToken;
    })
    .catch((error) => {
      console.error("Error fetching CSRF token:", error);
    });
});

document
  .getElementById("abogado-form-validacion")
  .addEventListener("submit", async function (event) {
    event.preventDefault();

    let rut_abogado = document.getElementById("rut").value.trim();
    rut_abogado = rut_abogado.replace(/[.]/g, ""); // Limpiar formato de RUT
    // Añadir el guion antes del último dígito
    rut_abogado = rut_abogado.replace(/(\d{7})(\d{1})$/, "$1-$2"); // Añadir el guion antes del último dígito

    if (!rut_abogado) {
      alert("Todos los campos son obligatorios.");
      return;
    }

    const formData = {
      rut_abogado,
      formType: document.querySelector("input[name='formType']").value,
    };

    console.log("Enviando:", formData);

    try {
      const response = await fetch("/submit-form", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "CSRF-Token": document.getElementById("csrf-token").value,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error en la respuesta del servidor:", errorText);
        throw new Error("Error al enviar el formulario: " + response.status);
      }

      document.getElementById("abogado-form-validacion").reset();
      alert("Formulario procesado con éxito.");
    } catch (error) {
      console.error("Error:", error);
      alert(
        "Hubo un problema al procesar la solicitud. Por favor, inténtelo de nuevo."
      );
    }
  });
