// index.js
import express from 'express';
import dotenv from 'dotenv';
import BookingRoutes from './routes/api.js'
import cors from 'cors';


dotenv.config(); 

const app = express();
const port = process.env.PORT || 5000;

// // CORS configuration for both local and production environments
// const allowedOrigins = [
//   'http://localhost:3000', // Local development
//   'https://www.samarthprojecttrial.online', // Your production frontend domain
// ];


// app.use(cors({
//   origin: function(origin, callback) {
//     if (!origin || allowedOrigins.indexOf(origin) !== -1) {
//       callback(null, true);
//     } else {
//       callback(new Error('Not allowed by CORS'));
//     }
//   }
// }));


//allowing cors for all traffic 
app.use(cors());


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
