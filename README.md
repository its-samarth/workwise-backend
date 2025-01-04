
## Backend
### Backend (Render)
- Deployed at: https://workwise-backend-566v.onrender.com/
- Auto-deploys from main branch

### Frontend (Production)
- Deployed at: https://www.samarthprojecttrial.online/train
- Auto-deploys from aws amplify
### Tech Stack
- Node.js
- Express.js
- PostgreSQL
- Prisma ORM
- Docker

### Setup
```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Set environment variables
cp .env.example .env

# Required environment variables
DATABASE_URL=postgresql://user:password@localhost:5432/traindb
JWT_SECRET=your_jwt_secret
CORS_ORIGIN=http://localhost:3000

# Start development server
npm run dev

# Start production server
npm run start
```

## Environment Variables
```
DATABASE_URL=postgresql://user:password@localhost:5432/traindb
PORT=3000
JWT_SECRET=your_secret
CORS_ORIGIN=https://www.samarthprojecttrial.online
```


# API - Rest Endpoints

Node.js/Express backend for train seat booking system with PostgreSQL database.

### API Endpoints

```
POST   /api/auth/[...nextauth]  # Authentication routes
GET    routes/api/seats               # Get all seats status
POST   routes//api/booking             # Create new booking
POST   routes//api/booking/:bookingid/cancel      # Cancel booking
POST   routes//api/reset               # Reset all seats
```

### API Endpoints
<img width="923" alt="prod bookseats" src="https://github.com/user-attachments/assets/738b8ff9-78d8-48b4-a5b7-e2795a20856a" />
<img width="983" alt="prod reset system" src="https://github.com/user-attachments/assets/78d6f3ad-ddce-4457-8b63-e1b79f183ba7" />
<img width="956" alt="prod getseats" src="https://github.com/user-attachments/assets/bc52c73c-ce61-47f4-9a4d-87e87f65f4be" />
<img width="914" alt="prod cancelseats" src="https://github.com/user-attachments/assets/132a476b-11bf-484c-9d3b-8f5740ef7040" />



## API Endpoints

### Get All Seats
```
GET /routes/api/seats

Response:
[
  {
    "id": 1,
    "seatNumber": 1,
    "rowNumber": 1,
    "isBooked": true,
    "bookingId": 19
  },
  ...
]
```

### Create Booking
```
POST /routes/api/bookings

Request:
{
  "numberOfSeats": 5,
  "userId": 5  // Get from www.samarthprojecttrial.online after login
}

Response:
{
  "id": 21,
  "userId": 5,
  "createdAt": "2024-12-31T21:02:11.951Z",
  "status": "ACTIVE"
}
```

### Cancel Booking
```
POST /routes/api/bookings/{bookingId}/cancel

Response:
{
  "message": "Booking cancelled successfully"
}
```

### Reset System
```
POST /routes/api/reset

Response:
{
  "message": "System reset successful"
}
```





## Business Logic

- Train has 80 seats (7 seats/row, last row has 3 seats)
- Maximum 7 seats per booking
- Priority given to booking seats in same row
- If same row unavailable, books nearest available seats
- Seats can be booked until coach is full
- Booked seats cannot be reserved by other users


## Database Schema

```prisma
generator client {
  provider = "prisma-client-js"
  binaryTargets = ["native", "rhel-openssl-1.0.x"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id         Int          @id @default(autoincrement())
  name       String
  email      String       @unique
  image_url  String?
  createdAt  DateTime     @default(now())
  bookings   Booking[]
}

model Seat {
  id         Int       @id @default(autoincrement())
  seatNumber Int       // 1 to 80
  rowNumber  Int       // 1 to 12 (11 rows of 7 seats + 1 row of 3 seats)
  isBooked   Boolean   @default(false)
  booking    Booking?   @relation(fields: [bookingId], references: [id])
  bookingId  Int?
}

model Booking {
  id        Int      @id @default(autoincrement())
  userId    Int
  user      User     @relation(fields: [userId], references: [id])
  seats     Seat[]
  createdAt DateTime @default(now())
  status    String   @default("ACTIVE") 
}
```

## Notes
- Get userId from live website: https://www.samarthprojecttrial.online
- Base URL: https://workwise-backend-566v.onrender.com/
