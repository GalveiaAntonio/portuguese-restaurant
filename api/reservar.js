const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  try {
    const { nome, email, data, hora, pessoas, mesa } = req.body;

    if (!nome || !email || !data || !hora) {
      return res.status(400).json({ error: 'Dados em falta.' });
    }

    await transporter.sendMail({
      from: `Casa do Cais <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'A sua reserva na Casa do Cais está confirmada',
      html: `
        <div style="font-family:sans-serif;background:#F5F1E6;padding:24px;">
          <h2 style="color:#1C3D5A;">Reserva confirmada, ${nome}!</h2>
          <p>Guardámos a sua mesa junto ao Tejo:</p>
          <ul>
            <li><b>Data:</b> ${data} às ${hora}</li>
            <li><b>Pessoas:</b> ${pessoas}</li>
            <li><b>Mesa:</b> ${mesa}</li>
          </ul>
          <p>Até já,<br>Casa do Cais</p>
        </div>
      `,
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Erro ao enviar email:', err);
    return res.status(500).json({ error: 'Não foi possível enviar o email.' });
  }
};