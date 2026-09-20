import { Server as SocketIOServer, Socket } from 'socket.io';
import { getDatabase } from '../db';
import { spatialPipeline } from '../spatial/pipeline';
import { GPSReport } from '../../../../packages/core/types/train';
import { simulation } from '../simulation/engine';

export function setupSocketIO(io: SocketIOServer) {
  simulation.attach(io);

  io.on('connection', async (socket: Socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    try {
      const db = getDatabase();
      const allTrains = await db.getAllTrains();
      socket.emit('train:all', allTrains);
    } catch (err) {
      console.error('[Socket.io] Error sending initial trains:', err);
    }

    socket.on('train:subscribe', async (trainNo: string) => {
      socket.join(`train:${trainNo}`);
      try {
        const db = getDatabase();
        const train = await db.getTrainByNo(trainNo);
        if (train) socket.emit('train:state', train);
      } catch (err) {
        console.error(`[Socket.io] Error subscribing to train ${trainNo}:`, err);
      }
    });

    socket.on('gps:report', async (report: GPSReport) => {
      try {
        const db = getDatabase();
        const existingTrain = await db.getTrainByNo(report.trainNo);
        const allTrains = await db.getAllTrains();
        const stations = await db.getAllStations();
        const updatedState = spatialPipeline.processReport(report, existingTrain, allTrains, stations);
        await db.upsertTrain(updatedState);
        io.emit('train:state', updatedState);
      } catch (err) {
        console.error('[Socket.io] Error processing gps:report:', err);
      }
    });

    socket.on('simulation:trigger', async () => {
      await simulation.triggerOvertake();
    });

    socket.on('simulation:reset', async () => {
      await simulation.reset();
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });
}
