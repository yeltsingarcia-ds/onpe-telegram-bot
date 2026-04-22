module.exports = async function handler(req, res) {
  try {
    res.setHeader("Content-Type", "image/png");

    const svg = `
      <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="white"/>
        <text x="50%" y="50%" font-size="40" text-anchor="middle" fill="black">
          ONPE RESULTADOS
        </text>
      </svg>
    `;

    res.status(200).send(svg);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error generando imagen" });
  }
};
