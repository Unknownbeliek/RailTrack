import { Server as SocketIOServer, Socket } from 'socket.io';
import { getDatabase } from '../db';
import { spatialPipeline } from '../spatial/pipeline';
import { GPSReport } from '../../../../packages/core/types/train';
import { getInitialDemoTrains } from '../seed/demoData';

export function setupSocketIO(io: SocketIOServer) {
  let simulationStep = 0;

  io.on('connection', async (socket: Socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    try {
      const db = getDatabase();
      const allTrains = await db.getAllTrains();
      socket.emit('train:all', allTrains);
    } catch (err) {
      console.error('[Socket.io] Error sending initial trains:', err);
    }

    // Subscribe to a single train's updates
    socket.on('train:subscribe', async (trainNo: string) => {
      socket.join(`train:${trainNo}`);
      try {
        const db = getDatabase();
        const train = await db.getTrainByNo(trainNo);
        if (train) {
          socket.emit('train:state', train);
        }
      } catch (err) {
        console.error(`[Socket.io] Error subscribing to train ${trainNo}:`, err);
      }
    });

    // Ingest live GPS report
    socket.on('gps:report', async (report: GPSReport) => {
      try {
        const db = getDatabase();
        const existingTrain = await db.getTrainByNo(report.trainNo);
        const allTrains = await db.getAllTrains();
        const stations = await db.getAllStations();

        const updatedState = spatialPipeline.processReport(report, existingTrain, allTrains, stations);
        await db.upsertTrain(updatedState);
        await db.logTelemetry({
          trainNo: report.trainNo,
          lat: report.lat,
          lng: report.lng,
          speed: updatedState.speed,
          heading: updatedState.heading,
          accuracy: report.accuracy,
          timestamp: new Date(),
        });

        io.emit('train:state', updatedState);
      } catch (err) {
        console.error('[Socket.io] Error processing gps:report:', err);
      }
    });

    // Live Overtake Simulation Trigger
    socket.on('simulation:trigger', async () => {
      try {
        const db = getDatabase();
        const rajdhani = await db.getTrainByNo('12301');
        const sampark = await db.getTrainByNo('12393');
        if (!rajdhani || !sampark) return;

        let message = '';
        let updatedRajdhani = { ...rajdhani };
        let updatedSampark = { ...sampark };

        if (simulationStep === 0) {
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
          simulationStep = 1;
        } else if (simulationStep === 1) {
          message = 'Step 2: 12301 Rajdhani overtakes 12393 on Tundla mainline at 124 km/h!';
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
          simulationStep = 2;
        } else {
          message = 'Step 3: Track cleared. 12393 leaves siding and accelerates to 88 km/h.';
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
          simulationStep = 0;
        }

        await db.upsertTrain(updatedRajdhani);
        await db.upsertTrain(updatedSampark);

        io.emit('simulation:step', { step: simulationStep, message });
        io.emit('train:state', updatedRajdhani);
        io.emit('train:state', updatedSampark);
      } catch (err) {
        console.error('[Socket.io] Error in simulation:trigger:', err);
      }
    });

    socket.on('simulation:reset', async () => {
      try {
        simulationStep = 0;
        const db = getDatabase();
        const demoTrains = getInitialDemoTrains();
        const resetList = await db.resetTrains(demoTrains);
        io.emit('simulation:reset', { message: 'Reset to baseline' });
        io.emit('train:all', resetList);
      } catch (err) {
        console.error('[Socket.io] Error in simulation:reset:', err);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });
}
