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
    rut_abogado = rut_abogado.replace(/[.]/g, ""); // Limpiar puntos del RUT

    if (!rut_abogado) {
      alert("Todos los campos son obligatorios.");
      return;
    }

    // Asegurar que se agrega el guion antes del último dígito
    if (!rut_abogado.includes("-")) {
      const rutSinDigitoVerificador = rut_abogado.slice(0, -1);
      const digitoVerificador = rut_abogado.slice(-1);
      rut_abogado = `${rutSinDigitoVerificador}-${digitoVerificador}`;
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

      /*if (!response.ok) {
        const errorText = await response.text();
        console.error("Error en la respuesta del servidor:", errorText);
        throw new Error("Error al enviar el formulario: " + response.status);
      }*/
      
      if (!response.ok) {
        let errorBase;
        try {
          errorBase = await response.text();
        } catch (e) {
          errorBase = "Error desconocido";
        }

        const error = JSON.parse(errorBase)?.error || errorBase;

        console.error("Error en la respuesta del servidor:", error);
        // Manejar mensajes de error específicos
        if (
          error === "Lawyer not found in appbogado database"
        ) {
          alert(
            "No se encuentra el abogado! Regístrese en:\nhttps://www.appbogado.cl/registro"
          );
        } else if (error === "Lawyer already validated in verified database") {
          alert("El abogado ya se encuentra validado");
        } else {
          alert(
            "Hubo un problema al procesar la solicitud. Por favor, inténtelo de nuevo."
          );
        }
        
        return
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
