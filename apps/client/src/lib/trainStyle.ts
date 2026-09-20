import type { Map as MapLibreMap } from 'maplibre-gl';
import { TrainType } from '../types';

export interface Livery {
  body: string;
  dark: string;
  stripe: string;
  window: string;
  roof: string;
  accent?: string;
  nose?: string;
}

/** Liveries taken from current IR coaches: Rajdhani LHB red/gold, VB white-blue-saffron. */
export const LIVERY: Record<TrainType, Livery> = {
  RAJDHANI: {
    body: '#C1121F',
    dark: '#7A121A',
    stripe: '#E8B923',
    window: '#1A1410',
    roof: '#4A0E12',
    nose: '#7A121A',
  },
  VANDE_BHARAT: {
    body: '#F4F7FB',
    dark: '#0B1B36',
    stripe: '#1E4E9C',
    window: '#0B1220',
    roof: '#111827',
    accent: '#EA580C',
    nose: '#1E4E9C',
  },
  SHATABDI: {
    body: '#1D4ED8',
    dark: '#1E3A8A',
    stripe: '#F8FAFC',
    window: '#0F172A',
    roof: '#1E3A8A',
    nose: '#1E3A8A',
  },
  DURONTO: {
    body: '#65A30D',
    dark: '#3F6212',
    stripe: '#FACC15',
    window: '#111827',
    roof: '#365314',
    nose: '#3F6212',
  },
  SF: {
    body: '#1E3A8A',
    dark: '#172554',
    stripe: '#DC2626',
    window: '#0F172A',
    roof: '#172554',
    nose: '#172554',
  },
  MAIL: {
    body: '#475569',
    dark: '#1E293B',
    stripe: '#F8FAFC',
    window: '#0F172A',
    roof: '#334155',
    nose: '#1E293B',
  },
  PASSENGER: {
    body: '#9F1239',
    dark: '#881337',
    stripe: '#FDE68A',
    window: '#1C1917',
    roof: '#4C0519',
    nose: '#881337',
  },
  FREIGHT: {
    body: '#A16207',
    dark: '#713F12',
    stripe: '#44403C',
    window: '#1C1917',
    roof: '#44403C',
    nose: '#713F12',
  },
};

export const TYPE_COLORS: Record<TrainType, string> = {
  RAJDHANI: '#C1121F',
  VANDE_BHARAT: '#1E4E9C',
  SHATABDI: '#1D4ED8',
  DURONTO: '#65A30D',
  SF: '#1E3A8A',
  MAIL: '#64748B',
  PASSENGER: '#9F1239',
  FREIGHT: '#A16207',
};

export const TYPE_LABEL: Record<TrainType, string> = {
  RAJDHANI: 'Rajdhani (LHB red)',
  VANDE_BHARAT: 'Vande Bharat',
  SHATABDI: 'Shatabdi',
  DURONTO: 'Duronto',
  SF: 'Superfast',
  MAIL: 'Mail / Express',
  PASSENGER: 'Passenger',
  FREIGHT: 'Freight',
};

export function delayColor(delayMinutes: number, status: string): string {
  if (status === 'LOOPED' || status === 'STOPPED') return '#FB923C';
  if (delayMinutes >= 45) return '#F87171';
  if (delayMinutes >= 15) return '#FBBF24';
  return '#4ADE80';
}

export function delayKey(delayMinutes: number, status: string): string {
  if (status === 'LOOPED' || status === 'STOPPED') return 'held';
  if (delayMinutes >= 45) return 'verylate';
  if (delayMinutes >= 15) return 'late';
  return 'ontime';
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function paintTopDown(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  livery: Livery,
  role: 'loco' | 'coach' | 'tail',
  type?: TrainType
) {
  ctx.clearRect(0, 0, w, h);
  ctx.translate(w / 2, h / 2);

  const bodyW = role === 'loco' ? w * 0.58 : w * 0.52;
  const bodyH = h * 0.9;
  const x = -bodyW / 2;
  const y = -bodyH / 2;

  // Nose (forward = up)
  if (role === 'loco') {
    ctx.beginPath();
    if (type === 'VANDE_BHARAT') {
      ctx.moveTo(0, y - h * 0.06);
      ctx.quadraticCurveTo(bodyW * 0.42, y + h * 0.04, bodyW * 0.38, y + h * 0.14);
      ctx.lineTo(-bodyW * 0.38, y + h * 0.14);
      ctx.quadraticCurveTo(-bodyW * 0.42, y + h * 0.04, 0, y - h * 0.06);
    } else {
      ctx.moveTo(0, y - h * 0.02);
      ctx.lineTo(bodyW * 0.36, y + h * 0.12);
      ctx.lineTo(-bodyW * 0.36, y + h * 0.12);
    }
    ctx.closePath();
    ctx.fillStyle = livery.nose || livery.dark;
    ctx.fill();
    if (livery.accent && type === 'VANDE_BHARAT') {
      ctx.strokeStyle = livery.accent;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  roundRect(ctx, x, y + (role === 'loco' ? h * 0.08 : 0), bodyW, bodyH - (role === 'loco' ? h * 0.08 : 0), role === 'loco' ? 5 : 4);
  ctx.fillStyle = livery.body;
  ctx.fill();
  ctx.strokeStyle = 'rgba(8,12,20,0.55)';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Roof strip
  roundRect(ctx, x + bodyW * 0.18, y + (role === 'loco' ? h * 0.12 : h * 0.06), bodyW * 0.64, bodyH * 0.16, 2);
  ctx.fillStyle = livery.roof;
  ctx.fill();

  // Window band
  ctx.fillStyle = livery.window;
  ctx.fillRect(x + 2, -bodyH * 0.08, bodyW - 4, bodyH * 0.22);

  // Livery stripe
  ctx.fillStyle = livery.stripe;
  ctx.fillRect(x + 1.5, bodyH * 0.16, bodyW - 3, Math.max(3, bodyH * 0.08));

  if (livery.accent && type === 'VANDE_BHARAT') {
    ctx.fillStyle = livery.accent;
    ctx.fillRect(x + 1.5, bodyH * 0.24, bodyW - 3, 2);
  }

  // Bogies
  ctx.fillStyle = '#111827';
  const bogieY1 = y + bodyH * 0.22;
  const bogieY2 = y + bodyH * 0.72;
  ctx.fillRect(-bodyW * 0.28, bogieY1, bodyW * 0.16, 4);
  ctx.fillRect(bodyW * 0.12, bogieY1, bodyW * 0.16, 4);
  ctx.fillRect(-bodyW * 0.28, bogieY2, bodyW * 0.16, 4);
  ctx.fillRect(bodyW * 0.12, bogieY2, bodyW * 0.16, 4);

  // Cab windshield for loco
  if (role === 'loco') {
    ctx.fillStyle = '#7DD3FC';
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.moveTo(-bodyW * 0.16, y + h * 0.1);
    ctx.lineTo(bodyW * 0.16, y + h * 0.1);
    ctx.lineTo(bodyW * 0.12, y + h * 0.16);
    ctx.lineTo(-bodyW * 0.12, y + h * 0.16);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function makeSprite(livery: Livery, role: 'loco' | 'coach' | 'tail', type?: TrainType): ImageData {
  const w = 40;
  const h = role === 'loco' ? 88 : 70;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  paintTopDown(ctx, w, h, livery, role, type);
  return ctx.getImageData(0, 0, w, h);
}

function delayLivery(color: string): Livery {
  return {
    body: color,
    dark: '#0F172A',
    stripe: '#F8FAFC',
    window: '#020617',
    roof: '#0F172A',
    nose: color,
  };
}

export function registerTrainIcons(map: MapLibreMap) {
  (Object.entries(LIVERY) as Array<[TrainType, Livery]>).forEach(([type, livery]) => {
    (['loco', 'coach', 'tail'] as const).forEach((role) => {
      const id = `${role}-${type}`;
      if (!map.hasImage(id)) map.addImage(id, makeSprite(livery, role, type), { pixelRatio: 2 });
    });
  });

  const delays: Record<string, string> = {
    ontime: '#4ADE80',
    late: '#FBBF24',
    verylate: '#F87171',
    held: '#FB923C',
  };
  Object.entries(delays).forEach(([key, color]) => {
    const liv = delayLivery(color);
    (['loco', 'coach', 'tail'] as const).forEach((role) => {
      const id = `min-${role}-${key}`;
      if (!map.hasImage(id)) map.addImage(id, makeSprite(liv, role), { pixelRatio: 2 });
    });
  });
}

export const ALL_TYPES: TrainType[] = [
  'RAJDHANI',
  'VANDE_BHARAT',
  'SHATABDI',
  'DURONTO',
  'SF',
  'MAIL',
  'PASSENGER',
  'FREIGHT',
];
