// index.js
import express from 'express';
import dotenv from 'dotenv';
import BookingRoutes from './routes/api.js'


dotenv.config(); 

const app = express();
const port = process.env.PORT || 5000;


app.use(express.json()); 
// Routes
app.use('/routes/api', BookingRoutes);  

// Root Route 
app.get('/', (req, res) => {
  res.send('Welcome to the Seat Booking API');
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
