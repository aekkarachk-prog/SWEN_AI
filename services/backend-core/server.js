// ไฟล์: services/backend-core/server.js
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// แบ่ง Route ตามงาน (ให้เพื่อนแยกกันไปเขียนใน Folder ตัวเอง)
// app.use('/api/auth', require('./src/auth/routes'));
// app.use('/api/patients', require('./src/patients/routes'));
// app.use('/api/history', require('./src/history/routes'));

app.get('/', (req, res) => {
  res.json({ message: "end Core is running!" });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Backend Core running on port ${PORT}`));