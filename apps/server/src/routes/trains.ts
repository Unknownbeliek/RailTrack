import { Router, Request, Response } from 'express';
import { getDatabase } from '../db';
import { spatialPipeline } from '../spatial/pipeline';
import { Server as SocketIOServer } from 'socket.io';
import { simulation } from '../simulation/engine';

export const trainsRouter = Router();

let ioInstance: SocketIOServer | null = null;
export function setTrainsSocketIO(io: SocketIOServer) {
  ioInstance = io;
}

trainsRouter.post('/simulate/overtake', async (_req: Request, res: Response) => {
  try {
    const result = await simulation.triggerOvertake();
    return res.json(result);
  } catch (err: any) {
    console.error('Error during overtake simulation:', err);
    return res.status(500).json({ error: 'Failed to simulate overtake' });
  }
});

trainsRouter.post('/simulate/reset', async (_req: Request, res: Response) => {
  try {
    const trains = await simulation.reset();
    return res.json({
      success: true,
      message: 'Demo fleet reset — trains are moving again',
      trains,
    });
  } catch (err: any) {
    console.error('Error resetting simulation:', err);
    return res.status(500).json({ error: 'Failed to reset simulation' });
  }
});

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
