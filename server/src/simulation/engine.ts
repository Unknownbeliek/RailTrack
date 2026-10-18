import { Server as SocketIOServer } from 'socket.io';
import { TrainState } from '../../../../packages/core/types/train';
import { getDatabase } from '../db';
import { buildNetwork, findLastStation, findStationAtKm } from '../seed/network';
import { generateFleet, materializeTrain, SimMeta, TYPE_SPEED } from '../seed/fleet';

const TICK_MS = 1000;

class SimulationEngine {
  private io: SocketIOServer | null = null;
  private timer: NodeJS.Timeout | null = null;
  private meta = new Map<string, SimMeta>();
  private delay = new Map<string, number>();
  private names = new Map<string, { trainName: string; type: TrainState['type'] }>();
  private tickCount = 0;
  private running = false;

  attach(io: SocketIOServer) {
    this.io = io;
  }

  async start() {
    if (this.running) return;
    await this.seed();
    this.running = true;
    this.timer = setInterval(() => {
      this.tick().catch((err) => console.error('[sim] tick failed', err));
    }, TICK_MS);
    console.log(`[sim] live demo engine started (${this.meta.size} trains, ${TICK_MS}ms tick)`);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.running = false;
  }

  async seed() {
    const { trains, meta } = generateFleet();
    this.meta = meta;
    this.delay.clear();
    this.names.clear();
    for (const t of trains) {
      this.delay.set(t.trainNo, t.delayMinutes);
      this.names.set(t.trainNo, { trainName: t.trainName, type: t.type });
    }
    const db = getDatabase();
    await db.resetTrains(trains);
    console.log(`[sim] seeded ${trains.length} demo trains across ${buildNetwork().routes.length} corridors`);
    return trains;
  }

  async reset() {
    const trains = await this.seed();
    this.io?.emit('simulation:reset', { message: 'Demo fleet reset' });
    this.io?.emit('train:all', trains);
    return trains;
  }

  async triggerOvertake() {
    const network = buildNetwork();
    const route = network.routeById.get('NDLS_HWH');
    if (!route) return { success: false, message: 'NDLS–HWH corridor missing' };

    const held = this.meta.get('12393');
    const flyer = this.meta.get('12301');
    if (!held || !flyer) return { success: false, message: 'Demo pair 12301/12393 missing' };

    const tdl = route.stationKm.find((s) => s.code === 'TDL');
    const tdlProgress = tdl ? tdl.km / route.index.lengthKm : 0.22;

    held.progress = tdlProgress;
    held.looped = true;
    held.cruiseSpeed = 0;
    held.dwellUntil = Date.now() + 90 * 1000;
    held.direction = 1;

    flyer.progress = Math.max(0.02, tdlProgress - 0.035);
    flyer.looped = false;
    flyer.direction = 1;
    flyer.cruiseSpeed = 124;
    flyer.dwellUntil = 0;

    this.delay.set('12393', 42);
    this.delay.set('12301', 4);

    const trains = await this.rebuildAll();
    this.io?.emit('simulation:step', {
      step: 1,
      message: 'Overtake demo: 12393 held on Tundla loop, 12301 Rajdhani closing on the mainline.',
    });
    this.io?.emit('simulation:focus', {
      lng: 78.2411,
      lat: 27.2063,
      zoom: 9,
      trainNos: ['12393', '12301'],
    });
    this.io?.emit('trains:snapshot', trains);

    return {
      success: true,
      message: 'Overtake demo: 12393 looped at Tundla, 12301 approaching on mainline.',
      trains: trains.filter((t) => t.trainNo === '12301' || t.trainNo === '12393'),
    };
  }

  private async rebuildAll(): Promise<TrainState[]> {
    const network = buildNetwork();
    const db = getDatabase();
    const out: TrainState[] = [];
    for (const [trainNo, m] of this.meta) {
      const route = network.routeById.get(m.routeId);
      const named = this.names.get(trainNo);
      if (!route || !named) continue;
      const train = materializeTrain(
        {
          trainNo,
          trainName: named.trainName,
          type: named.type,
          delayMinutes: this.delay.get(trainNo) || 0,
        },
        route,
        m
      );
      out.push(train);
      await db.upsertTrain(train);
    }
    this.attachNearby(out);
    for (const t of out) await db.upsertTrain(t);
    return out;
  }

  private attachNearby(trains: TrainState[]) {
    const byRoute = new Map<string, TrainState[]>();
    for (const t of trains) {
      const list = byRoute.get(t.routeId) || [];
      list.push(t);
      byRoute.set(t.routeId, list);
    }
    for (const list of byRoute.values()) {
      list.sort((a, b) => a.kmMarker - b.kmMarker);
      for (let i = 0; i < list.length; i++) {
        const me = list[i];
        const nearby = [];
        for (const j of [i - 1, i + 1, i - 2, i + 2]) {
          if (j < 0 || j >= list.length) continue;
          const other = list[j];
          const distanceKm = Math.abs(other.kmMarker - me.kmMarker);
          if (distanceKm > 45) continue;
          nearby.push({
            trainNo: other.trainNo,
            trainName: other.trainName,
            type: other.type,
            direction: other.heading - me.heading > 90 ? ('OPPOSITE' as const) : ('SAME' as const),
            position: other.kmMarker > me.kmMarker ? ('AHEAD' as const) : ('BEHIND' as const),
            distanceKm: Math.round(distanceKm * 10) / 10,
            speed: Math.round(other.speed),
            relativeSpeed: Math.round(other.speed - me.speed),
          });
        }
        me.nearbyTrains = nearby.slice(0, 3);
      }
    }
  }

  private async tick() {
    if (!this.running) return;
    const network = buildNetwork();
    const db = getDatabase();
    const now = Date.now();
    this.tickCount++;
    const snapshot: TrainState[] = [];

    for (const [trainNo, m] of this.meta) {
      const route = network.routeById.get(m.routeId);
      const named = this.names.get(trainNo);
      if (!route || !named) continue;
      const length = route.index.lengthKm || 1;

      if (m.looped && now > m.dwellUntil) {
        m.looped = false;
        m.cruiseSpeed = TYPE_SPEED[named.type] || 70;
      }

      if (now >= m.dwellUntil && !m.looped) {
        const kmPerSec = m.cruiseSpeed / 3600;
        m.progress += m.direction * (kmPerSec * (TICK_MS / 1000)) / length;

        if (m.progress >= 0.995) {
          m.progress = 0.995;
          m.direction = -1;
          m.dwellUntil = now + 25000;
        } else if (m.progress <= 0.005) {
          m.progress = 0.005;
          m.direction = 1;
          m.dwellUntil = now + 25000;
        } else if (this.tickCount % 7 === 0) {
          const km = m.progress * length;
          const next = findStationAtKm(route, km, m.direction);
          const last = findLastStation(route, km, m.direction);
          const nearHalt = next && Math.abs(next.km - km) < 1.2;
          const atHalt = last && Math.abs(last.km - km) < 0.6;
          if ((nearHalt || atHalt) && named.type !== 'FREIGHT' && named.type !== 'RAJDHANI') {
            const chance = named.type === 'PASSENGER' ? 0.28 : named.type === 'MAIL' ? 0.12 : 0.08;
            if (Math.random() < chance) {
              m.dwellUntil = now + (named.type === 'PASSENGER' ? 40000 : 22000);
            }
          }
        }
      }

      if (this.tickCount % 15 === 0 && !m.looped) {
        const d = this.delay.get(trainNo) || 0;
        const drift = Math.random() < 0.5 ? -1 : 1;
        this.delay.set(trainNo, Math.max(0, d + drift));
      }

      const train = materializeTrain(
        {
          trainNo,
          trainName: named.trainName,
          type: named.type,
          delayMinutes: this.delay.get(trainNo) || 0,
        },
        route,
        m
      );
      snapshot.push(train);
    }

    if (this.tickCount % 5 === 0) this.attachNearby(snapshot);

    await Promise.all(snapshot.map((t) => db.upsertTrain(t)));
    this.io?.emit('trains:snapshot', snapshot);
  }
}

export const simulation = new SimulationEngine();
