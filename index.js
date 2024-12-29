const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Basic route
app.get('/hello', (req, res) => {
  res.send('Hello from backend');
});

app.listen(PORT, () => {
  console.log(`Backend server running at http://localhost:${PORT}`);
});

// Export the app as a Lambda handler
module.exports.handler = serverless(app);