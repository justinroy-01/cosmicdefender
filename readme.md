# Cosmic Defender

Cosmic Defender is a browser-based 2D arcade space shooter built with HTML, CSS, and JavaScript. Control a spaceship near the bottom of the screen, dodge hazards, destroy alien ships, and survive as long as possible.

Note: Currently, the game is designed for desktop browsers and may not function properly on mobile devices.

## How to Play

1. Open [Click here](https://cosmicdefender-theta.vercel.app/) in a modern web browser.
2. Move the spaceship and fire at incoming aliens.
3. Collect boosters and avoid enemy attacks.
4. The game ends when all lives are lost.

## Controls

| Key | Action |
| --- | --- |
| `A` or `Left Arrow` | Move left |
| `D` or `Right Arrow` | Move right |
| `Space` | Fire lasers |
| `R` | Restart after game over |

## Scoring

- Points are awarded only when an alien is completely defeated.
- Obstacles do not award points.
- Survival time does not award points.
- Multi-hit aliens award their points only after all of their health is depleted.
- The bonus-points booster awards exactly **500 points**.

## Lives and Damage

The player starts with 3 lives. A life is lost when:

- An asteroid or obstacle collides with the spaceship.
- An alien collides with the spaceship.
- An alien beam hits the spaceship.

Objects and aliens leaving the bottom of the canvas do not cost a life. A short invulnerability period is applied after taking damage to prevent several immediate hits from removing multiple lives.

## Alien Types

### Scout

- Appears early in the game.
- Fires straight beams.
- Health: 1
- Value: 100 points

### Striker

- Fires diagonal beams aimed toward the player.
- Health: 1
- Value: 150 points

### Bomber

- Fires expanding circular beams.
- Health: 2
- Value: 250 points

### Tank

- Starts appearing after the score reaches 5,000.
- Has a slower movement speed and fires a three-beam burst.
- Health: 3
- Value: 400 points

### Phantom

- Starts appearing after the score reaches 5,000.
- Moves quickly and fires zig-zag beams.
- Health: 2
- Value: 600 points

## Boosters

Boosters fall from the top of the screen and activate when collected by the spaceship.

| Booster | Effect |
| --- | --- |
| `✦` Spread Beam | Fires multiple laser beams for 8 seconds |
| `+` Extra Life | Adds one life, up to a maximum of 5 |
| `500` Bonus Points | Adds exactly 500 points |
| `S` Shield | Makes the spaceship invulnerable for 10 seconds; this booster is rare |

The active power-up status is shown in the game header.

## Project Files

- `index.html` — Game layout, HUD, controls, and canvas.
- `style.css` — Space-themed visual styling and responsive layout.
- `script.js` — Game loop, movement, collisions, enemies, projectiles, scoring, lives, and boosters.

