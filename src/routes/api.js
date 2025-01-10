import express from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

// Get all seats
router.get('/seats', async (req, res) => {
  try {
    const seats = await prisma.seat.findMany({
      orderBy: [
        { rowNumber: 'asc' },
        { seatNumber: 'asc' }
      ]
    });
    res.json(seats);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
// Book seats
router.post('/bookings', async (req, res) => {
  try {
    const { numberOfSeats, userId } = req.body;

    if (numberOfSeats > 7) {
      return res.status(400).json({ error: 'Cannot book more than 7 seats at once' });
    }

    const availableSeats = await prisma.seat.findMany({
      where: { isBooked: false },
      orderBy: [
        { rowNumber: 'asc' },
        { seatNumber: 'asc' }
      ]
    });

    
    const seatsByRow = availableSeats.reduce((acc, seat) => {
      if (!acc[seat.rowNumber]) acc[seat.rowNumber] = [];
      acc[seat.rowNumber].push(seat);
      return acc;
    }, {});

    let seatsToBook = [];
    
    
    for (const [rowNum, seats] of Object.entries(seatsByRow)) {
      const consecutiveSeats = findConsecutiveSeats(seats, numberOfSeats);
      if (consecutiveSeats.length === numberOfSeats) {
        seatsToBook = consecutiveSeats;
        break;
      }
    }

   
    if (seatsToBook.length === 0) {
      const clusters = findBestSeatCluster(seatsByRow, numberOfSeats);
      seatsToBook = clusters;
    }

    if (seatsToBook.length < numberOfSeats) {
      return res.status(400).json({ error: 'Not enough seats available' });
    }

   
    seatsToBook = seatsToBook.slice(0, numberOfSeats);

    const booking = await prisma.$transaction(async (prisma) => {
      const booking = await prisma.booking.create({
        data: {
          userId,
          seats: {
            connect: seatsToBook.map(seat => ({ id: seat.id }))
          }
        }
      });

      await prisma.seat.updateMany({
        where: {
          id: {
            in: seatsToBook.map(seat => seat.id)
          }
        },
        data: {
          isBooked: true
        }
      });

      return booking;
    });

    res.json(booking);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

function findConsecutiveSeats(seats, numberOfSeats) {
  if (seats.length < numberOfSeats) return [];
  
  const sortedSeats = [...seats].sort((a, b) => a.seatNumber - b.seatNumber);
  let consecutive = [sortedSeats[0]];
  
  for (let i = 1; i < sortedSeats.length; i++) {
    if (sortedSeats[i].seatNumber === consecutive[consecutive.length - 1].seatNumber + 1) {
      consecutive.push(sortedSeats[i]);
      if (consecutive.length === numberOfSeats) {
        return consecutive;
      }
    } else {
      consecutive = [sortedSeats[i]];
    }
  }
  
  return [];
}

function findBestSeatCluster(seatsByRow, numberOfSeats) {
  const rowNumbers = Object.keys(seatsByRow).map(Number).sort((a, b) => a - b);
  let bestCluster = [];
  let bestScore = Infinity;

  
  for (let startRowIndex = 0; startRowIndex < rowNumbers.length; startRowIndex++) {
    let currentCluster = [];
    let remainingSeats = numberOfSeats;
    let currentRowIndex = startRowIndex;


    while (remainingSeats > 0 && currentRowIndex < rowNumbers.length) {
      const currentRow = rowNumbers[currentRowIndex];
      const availableInRow = seatsByRow[currentRow];
      
      if (availableInRow && availableInRow.length > 0) {
        const sortedSeats = availableInRow.sort((a, b) => a.seatNumber - b.seatNumber);
        const seatsToTake = Math.min(remainingSeats, sortedSeats.length);
        currentCluster = [...currentCluster, ...sortedSeats.slice(0, seatsToTake)];
        remainingSeats -= seatsToTake;
      }
      
      currentRowIndex++;
    }

    if (currentCluster.length === numberOfSeats) {
      const score = calculateClusterScore(currentCluster);
      if (score < bestScore) {
        bestScore = score;
        bestCluster = currentCluster;
      }
    }
  }

  return bestCluster;
}

function calculateClusterScore(cluster) {
  let score = 0;
  
 
  const centerRow = cluster.reduce((sum, seat) => sum + seat.rowNumber, 0) / cluster.length;
  const centerSeat = cluster.reduce((sum, seat) => sum + seat.seatNumber, 0) / cluster.length;


  for (const seat of cluster) {
    const rowDist = Math.pow(seat.rowNumber - centerRow, 2);
    const seatDist = Math.pow(seat.seatNumber - centerSeat, 2);
    score += rowDist + seatDist;
  }

  return score;
}
// Cancel booking
router.post('/bookings/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findFirst({
      where: {
        id: parseInt(id)
      },
      include: {
        seats: true
      }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    await prisma.$transaction(async (prisma) => {
      await prisma.booking.update({
        where: { id: parseInt(id) },
        data: { status: 'CANCELLED' }
      });

      await prisma.seat.updateMany({
        where: {
          id: {
            in: booking.seats.map(seat => seat.id)
          }
        },
        data: {
          isBooked: false
        }
      });
    });

    res.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Reset all seats and bookings
router.post('/reset', async (req, res) => {
  try {
    await prisma.$transaction(async (prisma) => {
      // Delete all bookings
      await prisma.booking.deleteMany({});
      
      // Reset all seats to unbooked state
      await prisma.seat.updateMany({
        data: {
          isBooked: false
        }
      });

      // Re-initialize seat numbers if needed
      const seats = await prisma.seat.findMany({
        orderBy: [
          { rowNumber: 'asc' },
          { seatNumber: 'asc' }
        ]
      });

      if (seats.length === 0) {
        const seatsData = [];
        let seatNumber = 1;

        // Create 11 rows of 7 seats
        for (let row = 1; row <= 11; row++) {
          for (let seatInRow = 1; seatInRow <= 7; seatInRow++) {
            seatsData.push({
              seatNumber: seatNumber++,
              rowNumber: row,
              isBooked: false
            });
          }
        }

        // Create last row with 3 seats
        for (let seatInRow = 1; seatInRow <= 3; seatInRow++) {
          seatsData.push({
            seatNumber: seatNumber++,
            rowNumber: 12,
            isBooked: false
          });
        }

        await prisma.seat.createMany({
          data: seatsData
        });
      }
    });

    res.json({ message: 'System reset successful' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;