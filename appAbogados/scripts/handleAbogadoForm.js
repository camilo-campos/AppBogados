const { sendEmail } = require("./mailHandler");
const mailFormatAbogadoRegistro = './templateMailAbogadoRegistro.html';
const fs = require('fs');
const path = require('path');

const images = [
  {
    filename: 'footerAbogado.jpg',
    content: fs.readFileSync(path.resolve(__dirname, '../assets/footerAbogado.jpg')).toString('base64'),
    type: 'image/jpg+xml',
    disposition: 'inline',
    content_id: 'jpg_inline_image'  // This 'cid' will be used in the <img> tag
  }
];

async function handleAbogadoForm(formData) {

  // Send confirmation email to the abogado
  try {

    // phText is the content that will show if the email is not rendered as HTML
    phText = `Estimad@ ${formData.nombres},\n\nHemos recibido la información necesaria para su preinscripción satisfactoriamente.\n\nMuchas gracias por preferir appbogado.cl`
    
    const placeholders = {
      phAbogado: formData.nombres,
      phText,
    };

    
    const to = formData.mail;
    const from = "admin@appbogado.cl";
    const subject = "Confirmacion de preinscripcion en appbogado.cl";
    
    await sendEmail(to, from, subject, placeholders, mailFormatAbogadoRegistro, [], images);

    console.log("Email sent to abogado:", formData.mail);
  } catch (error) {
    console.error("Error sending email to abogado:", error);
  }
}

module.exports = { handleAbogadoForm };