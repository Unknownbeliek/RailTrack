import { Router, Request, Response } from 'express';
import { getDatabase } from '../db';
import { spatialPipeline } from '../spatial/pipeline';
import { getInitialDemoTrains } from '../seed/demoData';
import { Server as SocketIOServer } from 'socket.io';

export const trainsRouter = Router();

// Store reference to Socket.io instance
let ioInstance: SocketIOServer | null = null;
export function setTrainsSocketIO(io: SocketIOServer) {
  ioInstance = io;
}

// Current simulation step tracker
let currentSimStep = 0;

// GET /api/trains
trainsRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const trains = await db.getAllTrains();
    return res.json(trains);
  } catch (err: any) {
    console.error('Error fetching trains:', err);
    return res.status(500).json({ error: 'Failed to fetch trains' });
  }
});

// GET /api/trains/:trainNo
trainsRouter.get('/:trainNo', async (req: Request, res: Response) => {
  try {
    const { trainNo } = req.params;
    const db = getDatabase();
    const train = await db.getTrainByNo(trainNo);
    if (!train) {
      return res.status(404).json({ error: `Train ${trainNo} not found` });
    }
    return res.json(train);
  } catch (err: any) {
    console.error('Error fetching train:', err);
    return res.status(500).json({ error: 'Failed to fetch train details' });
  }
});

// POST /api/trains/:trainNo/telemetry
trainsRouter.post('/:trainNo/telemetry', async (req: Request, res: Response) => {
  try {
    const { trainNo } = req.params;
    const { lat, lng, speed, heading, accuracy } = req.body;

    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: 'lat and lng are required in telemetry report' });
    }

    const db = getDatabase();
    const existingTrain = await db.getTrainByNo(trainNo);
    const allTrains = await db.getAllTrains();
    const stations = await db.getAllStations();

    const updatedState = spatialPipeline.processReport(
      {
        trainNo,
        lat: Number(lat),
        lng: Number(lng),
        speed: speed !== undefined ? Number(speed) : undefined,
        heading: heading !== undefined ? Number(heading) : undefined,
        accuracy: accuracy !== undefined ? Number(accuracy) : 10,
        reporterId: (req.body.reporterId as string) || 'user-gps',
        timestamp: Date.now(),
      },
      existingTrain,
      allTrains,
      stations
    );

    await db.upsertTrain(updatedState);
    await db.logTelemetry({
      trainNo,
      lat: Number(lat),
      lng: Number(lng),
      speed: updatedState.speed,
      heading: updatedState.heading,
      accuracy: accuracy !== undefined ? Number(accuracy) : 10,
      timestamp: new Date(),
    });

    // Broadcast live telemetry update over WebSockets
    if (ioInstance) {
      ioInstance.emit('train:state', updatedState);
      ioInstance.to(`train:${trainNo}`).emit('train:state', updatedState);
    }

    return res.json({
      success: true,
      message: 'Telemetry processed successfully',
      train: updatedState,
    });
  } catch (err: any) {
    console.error('Error processing telemetry:', err);
    return res.status(500).json({ error: 'Failed to process telemetry' });
  }
});

// POST /api/trains/simulate/overtake
trainsRouter.post('/simulate/overtake', async (_req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const rajdhani = await db.getTrainByNo('12301');
    const sampark = await db.getTrainByNo('12393');

    if (!rajdhani || !sampark) {
      return res.status(400).json({ error: 'Demo trains 12301 or 12393 not found in database' });
    }

    let message = '';
    let updatedRajdhani = { ...rajdhani };
    let updatedSampark = { ...sampark };

    if (currentSimStep === 0) {
      // Step 1: Rajdhani approaches behind (closing to 4km at 118 km/h)
      message = 'Step 1: 12301 Howrah Rajdhani closes to 4 km behind 12393 at 118 km/h.';
      updatedRajdhani = {
        ...rajdhani,
        lat: 27.225,
        lng: 78.22,
        snappedLat: 27.225,
        snappedLng: 78.22,
        kmMarker: 203.2,
        speed: 118,
        nearbyTrains: [{ ...rajdhani.nearbyTrains[0], distanceKm: 4.0 }],
      };

      updatedSampark = {
        ...sampark,
        contextReasons: [
          {
            priority: 1,
            type: 'LOOPED',
            icon: '🔄',
            title: 'Looped at Tundla Junction',
            subtitle: 'Rajdhani Express approaching behind (4km)',
            detail: '12301 Rajdhani Express is passing Tundla mainline. Signal hold: ~2 min remaining.',
            estimatedHoldMinutes: 2,
            relatedTrain: 'Howrah Rajdhani Express',
            confidence: 'HIGH',
          },
        ],
        nearbyTrains: [{ ...sampark.nearbyTrains[0], distanceKm: 4.0 }],
      };

      currentSimStep = 1;
    } else if (currentSimStep === 1) {
      // Step 2: Rajdhani overtakes right beside Tundla on mainline at 124 km/h
      message = 'Step 2: 12301 Rajdhani is actively overtaking 12393 on Tundla mainline at 124 km/h!';
      updatedRajdhani = {
        ...rajdhani,
        lat: 27.2063,
        lng: 78.2411,
        snappedLat: 27.2063,
        snappedLng: 78.2411,
        kmMarker: 207.2,
        speed: 124,
        nearbyTrains: [{ ...rajdhani.nearbyTrains[0], distanceKm: 0.2, position: 'AHEAD' }],
      };

      updatedSampark = {
        ...sampark,
        contextReasons: [
          {
            priority: 1,
            type: 'LOOPED',
            icon: '⚡',
            title: 'Overtake in Progress!',
            subtitle: '12301 Howrah Rajdhani passing on Mainline at 124 km/h',
            detail: 'You are currently stopped on Tundla Loop 1. Accelerating after block clearance.',
            estimatedHoldMinutes: 1,
            relatedTrain: 'Howrah Rajdhani Express',
            confidence: 'HIGH',
          },
        ],
        nearbyTrains: [{ ...sampark.nearbyTrains[0], distanceKm: 0.2, position: 'AHEAD' }],
      };

      currentSimStep = 2;
    } else {
      // Step 3: Rajdhani speeds ahead, Sampark Kranti leaves loop siding and accelerates
      message = 'Step 3: Track cleared. 12393 Sampark Kranti leaves siding and accelerates to 88 km/h.';
      updatedRajdhani = {
        ...rajdhani,
        lat: 27.1511,
        lng: 78.3965,
        snappedLat: 27.1511,
        snappedLng: 78.3965,
        kmMarker: 223.8,
        speed: 120,
        nearbyTrains: [{ ...rajdhani.nearbyTrains[0], distanceKm: 16.6, position: 'AHEAD' }],
      };

      updatedSampark = {
        ...sampark,
        status: 'RUNNING',
        isOnLoopLine: false,
        lateralOffset: 0.8,
        speed: 88,
        slowDuration: 0,
        contextReasons: [
          {
            priority: 5,
            type: 'UNKNOWN',
            icon: '🚀',
            title: 'Accelerating on Mainline',
            subtitle: 'Departed Tundla Siding after Rajdhani overtake',
            detail: 'Green signal locked towards Firozabad & Kanpur Central.',
            confidence: 'HIGH',
          },
        ],
        nearbyTrains: [{ ...sampark.nearbyTrains[0], distanceKm: 16.6, position: 'AHEAD' }],
      };

      currentSimStep = 0;
    }

    await db.upsertTrain(updatedRajdhani);
    await db.upsertTrain(updatedSampark);

    if (ioInstance) {
      ioInstance.emit('simulation:step', { step: currentSimStep, message });
      ioInstance.emit('train:state', updatedRajdhani);
      ioInstance.emit('train:state', updatedSampark);
    }

    return res.json({
      success: true,
      step: currentSimStep,
      message,
      trains: [updatedSampark, updatedRajdhani],
    });
  } catch (err: any) {
    console.error('Error during overtake simulation:', err);
    return res.status(500).json({ error: 'Failed to simulate overtake' });
  }
});

// POST /api/trains/simulate/reset
trainsRouter.post('/simulate/reset', async (_req: Request, res: Response) => {
  try {
    currentSimStep = 0;
    const db = getDatabase();
    const demoTrains = getInitialDemoTrains();
    const resetList = await db.resetTrains(demoTrains);

    if (ioInstance) {
      ioInstance.emit('simulation:reset', { message: 'Simulation reset to baseline' });
      ioInstance.emit('train:all', resetList);
    }

    return res.json({
      success: true,
      message: 'Simulation state successfully reset',
      trains: resetList,
    });
  } catch (err: any) {
    console.error('Error resetting simulation:', err);
    return res.status(500).json({ error: 'Failed to reset simulation' });
  }
});
