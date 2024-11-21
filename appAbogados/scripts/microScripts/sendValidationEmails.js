const { databaseGet } = require('../databaseControl');
const { sendEmail } = require('../mailHandler');
const fs = require('fs');
const path = require('path');
const mailTemplatePath = '../emailTemplates/templateMailAbogadoValidacion.html';

async function sendValidationEmails() {
  try {
    // Define the attachment (footerAbogado.jpg)
    const footerImage = {
      filename: 'footerAbogado.jpg',
      content: fs.readFileSync(path.resolve(__dirname, '../../assets/footerAbogado.jpg')).toString('base64'),
      type: 'image/jpeg',
      disposition: 'inline',
      content_id: 'footerAbogado', // Content-ID for inline use
    };

    // Fetch all lawyers from dim_abogados
    //const lawyers = [{nombres: 'kriz', mail: 'contacto@krizcold.com'}];
    const lawyers = await databaseGet({ table: 'dim_abogados' });

    // For each lawyer, send the email
    for (const lawyer of lawyers) {
      const to = lawyer.mail;
      const from = 'admin@appbogado.cl';
      const subject = '¡Bienvenido a Appbogado.cl! Por favor valida tu identidad.';
      const htmlFilePath = path.join(__dirname, mailTemplatePath);
      const text = `Estimada/o colega ${lawyer.nombres}:

Es un gusto saludarte nuevamente. Agradecemos tu confianza en Appbogado.cl.

Para tu seguridad y la de todos nuestros usuarios, es necesario que valides tu identidad antes de comenzar a disfrutar de tu mes gratuito en Appbogado.cl. Puedes hacerlo en el siguiente enlace:

https://www.appbogado.cl/validacion-abogados

Nuestro sistema validará tu identidad a través del reconocimiento facial, lo que nos permitirá asegurar el correcto uso de tus datos personales. Esta medida forma parte de nuestra política de privacidad y tiene por objetivo que Appbogado.cl sea, efectivamente, una opción segura de contacto entre profesionales y potenciales clientes.

Desde ya te damos las gracias por tu comprensión.

Ante cualquier duda o inconveniente que tengas en este proceso, por favor no dudes en escribirnos a contacto@appbogado.cl

Cordialmente,
EQUIPO APPBOGADO
`;

      const placeholders = {
        phText: text,
        phNombreAbogado: lawyer.nombres,
      };

      await sendEmail(to, from, subject, placeholders, htmlFilePath, [], [footerImage]);

      console.log(`Validation email sent to ${to}`);
    }
  } catch (error) {
    console.error('Error sending validation emails:', error);
  }
}

module.exports = { sendValidationEmails };
