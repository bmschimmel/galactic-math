# Audio Engine

All sounds in Galactic Math are synthesized at runtime using the **Web Audio API**. No audio files are loaded or bundled. This keeps the game fully offline-capable after first load.

---

## Audio Context

An `AudioContext` is created lazily on first use (`getAudio()`). This is required because browsers block audio until a user gesture has occurred.

---

## Primitive Functions

Three low-level functions handle all sound synthesis:

### `playTone(freq, type, duration, vol, attack, decay)`
Plays a single oscillator tone with a simple envelope:
- Ramps volume up over `attack` seconds
- Decays exponentially to near-zero over `duration` seconds
- Wave types: `'sine'`, `'triangle'`, `'square'`, `'sawtooth'`

### `playFreqSweep(startFreq, endFreq, type, duration, vol)`
Like `playTone`, but sweeps the oscillator frequency from `startFreq` to `endFreq` over the duration using an exponential ramp. Used for rising/falling effects.

### `playNoise(duration, vol, highpass)`
Generates white noise filtered through a highpass biquad filter. Used for rocket rumble, hiss, and impact textures.

---

## Sound Library

All game sounds are defined in the `sounds` object. Each sound is a named function that composes the primitives with `setTimeout` offsets to create multi-part effects.

| Sound | Trigger | Description |
|---|---|---|
| `keypress(key)` | Number key pressed in input | Soft sine tone; frequency mapped to digit (0=523Hz → 9=1319Hz) |
| `correct()` | Correct answer submitted | Ascending lightsaber hum + two chime overtones |
| `wrong()` | Wrong answer submitted | Descending imperial-style sawtooth buzz |
| `navigate()` | Number/op toggled in setup | Short soft beep |
| `submit()` | Enter pressed | R2-D2-style beep-boop (two quick tones) |
| `missionStart()` | Begin Mission clicked | Rocket ignition: rumble → thrust build → liftoff shriek (~1.2s) |
| `victory()` | Passing score celebration | 4-note triumphant fanfare (Star Wars-inspired) |
| `modeActivate()` | Generic mode enable | Short rising power-up hum |
| `blasterFlyby()` | Comet celebration start | TIE fighter–style whoosh |
| `shockwaveImpact()` | Ring shockwave celebration start | Deep bass thud |
| `burstPop()` | Particle burst (unused in current UI) | Sharp crack + sparkle |
| `hyperspaceJump()` | Hyperspace mode completed | Rising roar sweeping up to 8kHz |
| `hyperspaceTimeout()` | Hyperspace timer expired | Descending failure buzz |
| `hyperspaceActivate()` | Hyperspace mode toggled ON | Hyperdrive charging up: rumble → high-energy peak |
| `kesselRunActivate()` | Kessel Run mode toggled ON | Three countdown beeps + race start burst |
| `abortMission()` | Quit button clicked mid-quiz | Deflating power-down: engines losing thrust then silence |

---

## Error Handling

All audio calls are wrapped in `try/catch`. Audio errors are logged as warnings (`console.warn`) and do not interrupt gameplay.
