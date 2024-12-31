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
      if (seats.length >= numberOfSeats) {
        seatsToBook = seats.slice(0, numberOfSeats);
        break;
      }
    }

    if (seatsToBook.length === 0) {
      seatsToBook = availableSeats.slice(0, numberOfSeats);
    }

    if (seatsToBook.length < numberOfSeats) {
      return res.status(400).json({ error: 'Not enough seats available' });
    }

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