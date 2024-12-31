import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function initializeSeats() {
  try {
    // Clear existing seats
    await prisma.seat.deleteMany({});

    // Create 80 seats (11 rows of 7 seats + 1 row of 3 seats)
    const seats = [];
    let seatNumber = 1;

    // Create 11 full rows
    for (let row = 1; row <= 11; row++) {
      for (let seatInRow = 1; seatInRow <= 7; seatInRow++) {
        seats.push({
          seatNumber,
          rowNumber: row,
          isBooked: false
        });
        seatNumber++;
      }
    }

    // Create last row with 3 seats
    for (let seatInRow = 1; seatInRow <= 3; seatInRow++) {
      seats.push({
        seatNumber,
        rowNumber: 12,
        isBooked: false
      });
      seatNumber++;
    }

    await prisma.seat.createMany({
      data: seats
    });

    console.log('Seats initialized successfully');
  } catch (error) {
    console.error('Error initializing seats:', error);
  } finally {
    await prisma.$disconnect();
  }
}

initializeSeats();