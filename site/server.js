const express = require('express');
const path = require('path');
const app = express();

const root = __dirname;
app.use(express.static(root));

// SPA-fallback: если не найден статический файл – отдаём index.html (SPA)
app.use((req, res) => {
  const p = req.path;
  let file = '/pages/dashboard.html';
  if (p === '/login') file = '/pages/login.html';
  else if (p === '/' || p === '') file = '/pages/dashboard.html';
  else if (p.startsWith('/profile')) file = '/pages/profile.html';
  else if (p === '/banned') file = '/pages/banned.html';
  res.sendFile(path.join(root, file));
});

const PORT = process.env.PORT || 80;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));