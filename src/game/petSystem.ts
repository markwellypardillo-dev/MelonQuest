/**
 * Pet Follower System for MelonQuest.
 * Follower AI for Barnaby (Farm Dog) and Mochi (Farm Cat).
 * Features proximity trailing, idle wandering radius, sit/walk animations,
 * and high-performance pixel-art canvas rendering.
 * Strict zero-emoji policy applied.
 */

export interface PetEntity {
  id: 'dog' | 'cat';
  name: string;
  breed: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  direction: 'left' | 'right';
  isMoving: boolean;
  isSitting: boolean;
  speed: number;
  animTimer: number;
  idleTimer: number;
  wanderAngle: number;
}

export class PetFollowerSystem {
  private isFollowingPlayer = false;

  public pets: PetEntity[] = [
    {
      id: 'dog',
      name: 'Barnaby',
      breed: 'Golden Farm Terrier',
      x: 344,
      y: 492,
      targetX: 344,
      targetY: 492,
      direction: 'right',
      isMoving: false,
      isSitting: false,
      speed: 130,
      animTimer: 0,
      idleTimer: 0,
      wanderAngle: 0,
    },
    {
      id: 'cat',
      name: 'Mochi',
      breed: 'Calico Barn Cat',
      x: 352,
      y: 382,
      targetX: 352,
      targetY: 382,
      direction: 'left',
      isMoving: false,
      isSitting: true,
      speed: 110,
      animTimer: 0,
      idleTimer: 0,
      wanderAngle: Math.PI,
    },
  ];

  /**
   * Update pet AI behaviors relative to player coordinates.
   */
  public update(dt: number, playerX: number, playerY: number, isPlayerMoving: boolean) {
    if (!this.isFollowingPlayer) {
      if (isPlayerMoving) {
        this.isFollowingPlayer = true;
      } else {
        for (const pet of this.pets) {
          pet.animTimer += dt * 4;
        }
        return;
      }
    }

    for (const pet of this.pets) {
      pet.animTimer += dt * 8;

      const dx = playerX - pet.x;
      const dy = playerY - pet.y;
      const distToPlayer = Math.hypot(dx, dy);

      // Follow player offset based on pet type (dog follows slightly closer on left, cat wanders on right)
      const idealOffsetX = pet.id === 'dog' ? -36 : 36;
      const idealOffsetY = pet.id === 'dog' ? 12 : -12;
      const followTargetX = playerX + idealOffsetX;
      const followTargetY = playerY + idealOffsetY;

      if (distToPlayer > 56) {
        // Player is moving away: chase/follow player
        pet.isSitting = false;
        pet.isMoving = true;
        const targetDx = followTargetX - pet.x;
        const targetDy = followTargetY - pet.y;
        const targetDist = Math.hypot(targetDx, targetDy);

        if (targetDist > 6) {
          const vx = (targetDx / targetDist) * pet.speed;
          const vy = (targetDy / targetDist) * pet.speed;
          pet.x += vx * dt;
          pet.y += vy * dt;
          pet.direction = vx >= 0 ? 'right' : 'left';
        } else {
          pet.isMoving = false;
        }
        pet.idleTimer = 0;
      } else {
        // Player is nearby: idle or small wander radius
        pet.idleTimer += dt;

        if (pet.idleTimer > 2.5 && !isPlayerMoving) {
          // Wander within 24px radius
          pet.isSitting = false;
          const wanderRadius = pet.id === 'dog' ? 24 : 18;
          pet.wanderAngle += (Math.random() - 0.5) * dt * 2;
          const destX = playerX + Math.cos(pet.wanderAngle) * wanderRadius;
          const destY = playerY + Math.sin(pet.wanderAngle) * wanderRadius;

          const toDestX = destX - pet.x;
          const toDestY = destY - pet.y;
          const destDist = Math.hypot(toDestX, toDestY);

          if (destDist > 4) {
            pet.isMoving = true;
            const vx = (toDestX / destDist) * (pet.speed * 0.45);
            const vy = (toDestY / destDist) * (pet.speed * 0.45);
            pet.x += vx * dt;
            pet.y += vy * dt;
            pet.direction = vx >= 0 ? 'right' : 'left';
          } else {
            pet.isMoving = false;
            if (pet.idleTimer > 5) {
              pet.isSitting = true;
            }
          }
        } else {
          pet.isMoving = false;
          if (pet.idleTimer > 3) {
            pet.isSitting = true;
          }
        }
      }
    }
  }

  /**
   * Render pixel-art dog and cat entities onto the canvas in world coordinates.
   */
  public render(ctx: CanvasRenderingContext2D, _cameraX: number, _cameraY: number) {
    for (const pet of this.pets) {
      const worldX = Math.round(pet.x);
      const worldY = Math.round(pet.y);

      // Crisp 16-bit pixel ground shadow
      ctx.fillStyle = 'rgba(12, 8, 4, 0.5)';
      ctx.fillRect(worldX + 3, worldY + 15, 14, 3);
      ctx.fillRect(worldX + 5, worldY + 14, 10, 4);

      const legBob = pet.isMoving ? Math.round(Math.sin(pet.animTimer) * 1.5) : 0;
      const flip = pet.direction === 'left';

      ctx.save();
      if (flip) {
        ctx.translate(worldX + 20, worldY);
        ctx.scale(-1, 1);
      } else {
        ctx.translate(worldX, worldY);
      }

      if (pet.id === 'dog') {
        // Barnaby (Golden Terrier)
        const coat = '#d4ac0d';
        const shadow = '#b7950b';
        const collar = '#c0392b';

        // Body
        ctx.fillStyle = coat;
        ctx.fillRect(4, 8, 12, 7);
        ctx.fillStyle = shadow;
        ctx.fillRect(4, 13, 12, 2);

        // Head
        ctx.fillStyle = coat;
        ctx.fillRect(13, 4, 7, 7);
        // Floppy Ear
        ctx.fillStyle = shadow;
        ctx.fillRect(12, 5, 2, 4);
        // Snout
        ctx.fillStyle = '#f9e79f';
        ctx.fillRect(18, 7, 3, 3);
        ctx.fillStyle = '#111111';
        ctx.fillRect(20, 7, 1, 1); // Nose
        ctx.fillRect(16, 6, 1, 1); // Eye

        // Red Bandana Collar
        ctx.fillStyle = collar;
        ctx.fillRect(12, 9, 3, 2);

        // Legs
        ctx.fillStyle = shadow;
        if (pet.isSitting) {
          ctx.fillRect(4, 13, 5, 3);
          ctx.fillRect(12, 13, 3, 3);
        } else {
          ctx.fillRect(5, 13, 2, 3 + legBob);
          ctx.fillRect(9, 13, 2, 3 - legBob);
          ctx.fillRect(13, 13, 2, 3 + legBob);
        }

        // Wagging Tail
        const tailWag = Math.sin(pet.animTimer * 1.5) * 2;
        ctx.fillStyle = coat;
        ctx.fillRect(2, 6 + (pet.isMoving ? tailWag : 0), 3, 2);
      } else {
        // Mochi (Calico Cat)
        const furWhite = '#ffffff';
        const furOrange = '#e67e22';
        const furDark = '#2c3e50';

        // Body
        ctx.fillStyle = furWhite;
        ctx.fillRect(4, 9, 10, 6);
        ctx.fillStyle = furOrange;
        ctx.fillRect(6, 9, 4, 3);
        ctx.fillStyle = furDark;
        ctx.fillRect(11, 10, 3, 3);

        // Head
        ctx.fillStyle = furWhite;
        ctx.fillRect(12, 5, 6, 6);
        // Calico patch
        ctx.fillStyle = furOrange;
        ctx.fillRect(12, 5, 3, 3);
        // Pointed Ears
        ctx.fillStyle = furOrange;
        ctx.fillRect(12, 3, 2, 2);
        ctx.fillStyle = furWhite;
        ctx.fillRect(16, 3, 2, 2);
        // Eye & Nose
        ctx.fillStyle = '#27ae60'; // Green eye
        ctx.fillRect(15, 7, 1, 1);
        ctx.fillStyle = '#f1948a'; // Pink nose
        ctx.fillRect(17, 8, 1, 1);

        // Legs
        ctx.fillStyle = '#bdc3c7';
        if (pet.isSitting) {
          ctx.fillRect(4, 13, 8, 2);
        } else {
          ctx.fillRect(5, 13, 2, 2 + legBob);
          ctx.fillRect(11, 13, 2, 2 - legBob);
        }

        // Curved Tail
        ctx.fillStyle = furDark;
        ctx.fillRect(2, 7, 2, 4);
        ctx.fillRect(1, 5, 2, 3);
      }

      ctx.restore();
    }
  }
}
