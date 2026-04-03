const express = require('express');
const cors = require('cors');
require('./src/db'); // init DB
const seed = require('./src/seed');

seed();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/books',        require('./src/routes/books'));
app.use('/api/transactions', require('./src/routes/transactions'));
app.use('/api/parties',      require('./src/routes/parties'));
app.use('/api/categories',   require('./src/routes/categories'));
app.use('/api/reports',      require('./src/routes/reports'));
app.use('/api/settings',     require('./src/routes/settings'));
app.use('/api/backup',       require('./src/routes/backup'));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.BACKEND_PORT ?? 3001;
if (require.main === module) {
  app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
}
module.exports = app;
