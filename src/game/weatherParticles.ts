/**
 * Particle-based Weather Overlay for MelonQuest HTML5 Canvas.
 * Renders retro pixel-art falling rain streaks and shimmering heat haze bands.
 * Optimized for speed and zero per-frame string allocations.
 * Strict zero-emoji policy applied.
 */

import { type WeatherType } from './weatherSystem.ts';
import { type ParticleQuality } from './settings.ts';

interface RainDrop {
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
  colorIndex: 0 | 1;
}

interface SplashPip {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
}

interface HeatParticle {
  x: number;
  y: number;
  vy: number;
  wobbleSpeed: number;
  wobbleOffset: number;
  size: number;
  opacity: number;
}

export class WeatherParticleSystem {
  private rainPool: RainDrop[] = [];
  private splashPool: SplashPip[] = [];
  private heatPool: HeatParticle[] = [];
  private time: number = 0;
  private quality: ParticleQuality = 'ultra';

  // Rain colors
  private readonly rainColorA = '#7bb2d9';
  private readonly rainColorB = '#528ebb';

  // View dimensions
  private viewWidth = 640;
  private viewHeight = 360;

  constructor() {
    this.initPools();
  }

  public setQuality(quality: ParticleQuality) {
    this.quality = quality;
    this.initPools();
  }

  public getQuality(): ParticleQuality {
    return this.quality;
  }

  private initPools() {
    if (this.quality === 'off') {
      this.rainPool = [];
      this.splashPool = [];
      this.heatPool = [];
      return;
    }

    const rainCount = this.quality === 'ultra' ? 120 : 50;
    const splashCount = this.quality === 'ultra' ? 50 : 20;
    const heatCount = this.quality === 'ultra' ? 40 : 16;

    // Pre-allocated rain drops
    this.rainPool = [];
    for (let i = 0; i < rainCount; i++) {
      this.rainPool.push({
        x: Math.random() * (this.viewWidth + 100) - 50,
        y: Math.random() * this.viewHeight,
        vx: -35 - Math.random() * 20,
        vy: 360 + Math.random() * 80,
        length: 6 + Math.floor(Math.random() * 5),
        colorIndex: Math.random() < 0.6 ? 0 : 1,
      });
    }

    // Pre-allocated splash pips
    this.splashPool = [];
    for (let i = 0; i < splashCount; i++) {
      this.splashPool.push({
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 0,
        maxLife: 0.15,
        size: 2,
      });
    }

    // Pre-allocated rising heat haze dust particles
    this.heatPool = [];
    for (let i = 0; i < heatCount; i++) {
      this.heatPool.push({
        x: Math.random() * this.viewWidth,
        y: Math.random() * this.viewHeight,
        vy: -25 - Math.random() * 25,
        wobbleSpeed: 2 + Math.random() * 3,
        wobbleOffset: Math.random() * Math.PI * 2,
        size: 1 + Math.floor(Math.random() * 2),
        opacity: 0.15 + Math.random() * 0.25,
      });
    }
  }

  public setViewSize(width: number, height: number) {
    this.viewWidth = width;
    this.viewHeight = height;
  }

  private spawnSplash(x: number, y: number) {
    if (this.quality === 'off') return;
    let count = 0;
    for (let i = 0; i < this.splashPool.length; i++) {
      const pip = this.splashPool[i];
      if (pip.life <= 0) {
        pip.x = x;
        pip.y = y;
        pip.vx = (Math.random() - 0.5) * 60;
        pip.vy = -20 - Math.random() * 40;
        pip.life = 0.12 + Math.random() * 0.08;
        pip.maxLife = pip.life;
        pip.size = 2;
        count++;
        if (count >= 2) break;
      }
    }
  }

  public update(dt: number, weather: WeatherType) {
    if (this.quality === 'off' || weather === 'optimal') return;
    this.time += dt;

    if (weather === 'high_humidity') {
      const rainLen = this.rainPool.length;
      for (let i = 0; i < rainLen; i++) {
        const drop = this.rainPool[i];
        drop.x += drop.vx * dt;
        drop.y += drop.vy * dt;

        if (drop.y > this.viewHeight) {
          if (Math.random() < 0.35) {
            this.spawnSplash(drop.x, this.viewHeight - 12 + Math.random() * 10);
          }
          drop.y = -10 - Math.random() * 20;
          drop.x = Math.random() * (this.viewWidth + 80);
        }
        if (drop.x < -20) {
          drop.x = this.viewWidth + Math.random() * 40;
        }
      }

      const splashLen = this.splashPool.length;
      for (let i = 0; i < splashLen; i++) {
        const pip = this.splashPool[i];
        if (pip.life > 0) {
          pip.x += pip.vx * dt;
          pip.y += pip.vy * dt;
          pip.life -= dt;
        }
      }
    } else if (weather === 'drought') {
      const heatLen = this.heatPool.length;
      for (let i = 0; i < heatLen; i++) {
        const p = this.heatPool[i];
        p.y += p.vy * dt;
        p.x += Math.sin(this.time * p.wobbleSpeed + p.wobbleOffset) * 0.6;

        if (p.y < 0) {
          p.y = this.viewHeight + Math.random() * 20;
          p.x = Math.random() * this.viewWidth;
        }
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D, weather: WeatherType) {
    if (this.quality === 'off' || weather === 'optimal') return;

    if (weather === 'high_humidity') {
      // 1. Ambient rain storm tint scrim
      ctx.fillStyle = 'rgba(15, 30, 22, 0.28)';
      ctx.fillRect(0, 0, this.viewWidth, this.viewHeight);

      // 2. Render falling pixel rain streaks grouped by color to minimize fillStyle state changes
      ctx.fillStyle = this.rainColorA;
      const rainLen = this.rainPool.length;
      for (let i = 0; i < rainLen; i++) {
        const drop = this.rainPool[i];
        if (drop.colorIndex === 0) {
          const dx = drop.x | 0;
          const dy = drop.y | 0;
          ctx.fillRect(dx, dy, 1.5, drop.length);
          ctx.fillRect(dx - 1, dy + (drop.length >> 1), 1, drop.length * 0.5);
        }
      }

      ctx.fillStyle = this.rainColorB;
      for (let i = 0; i < rainLen; i++) {
        const drop = this.rainPool[i];
        if (drop.colorIndex === 1) {
          const dx = drop.x | 0;
          const dy = drop.y | 0;
          ctx.fillRect(dx, dy, 1.5, drop.length);
          ctx.fillRect(dx - 1, dy + (drop.length >> 1), 1, drop.length * 0.5);
        }
      }

      // 3. Render ground impact splashes using globalAlpha instead of string concatenation
      const splashLen = this.splashPool.length;
      ctx.fillStyle = '#b4dcff';
      for (let i = 0; i < splashLen; i++) {
        const pip = this.splashPool[i];
        if (pip.life > 0) {
          ctx.globalAlpha = Math.max(0, Math.min(1, pip.life / pip.maxLife));
          ctx.fillRect(pip.x | 0, pip.y | 0, pip.size, pip.size);
        }
      }
      ctx.globalAlpha = 1.0;
    } else if (weather === 'drought') {
      // 1. Ambient solar glare & drought tint scrim
      ctx.fillStyle = 'rgba(215, 125, 30, 0.14)';
      ctx.fillRect(0, 0, this.viewWidth, this.viewHeight);

      // 2. Shimmering horizontal heat haze scanline bands
      const bandHeight = 18;
      const numBands = Math.ceil(this.viewHeight / bandHeight);
      ctx.fillStyle = '#ffcd50';

      for (let i = 0; i < numBands; i++) {
        const y = i * bandHeight;
        const offset = Math.sin(this.time * 4.0 + i * 0.6) * 1.5;
        const waveAlpha = 0.04 + Math.sin(this.time * 3.0 + i * 0.8) * 0.035;
        ctx.globalAlpha = Math.max(0.01, Math.min(0.12, waveAlpha));
        ctx.fillRect(offset, y, this.viewWidth, bandHeight * 0.6);
      }

      // 3. Upward drifting warm thermal dust specks
      ctx.fillStyle = '#f0c34b';
      const heatLen = this.heatPool.length;
      for (let i = 0; i < heatLen; i++) {
        const p = this.heatPool[i];
        ctx.globalAlpha = p.opacity;
        ctx.fillRect(p.x | 0, p.y | 0, p.size, p.size);
      }
      ctx.globalAlpha = 1.0;
    }
  }
}
