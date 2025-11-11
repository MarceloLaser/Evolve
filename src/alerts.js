import { callback_queue, global } from './vars.js';
import { messageQueue } from './functions.js';
import { loc } from './locale.js';

const COOLDOWN_MS = 30_000;

const ACtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
let lastDingAt = 0;
let ignoredResources = ['RNA','DNA',`${global.race.species}`,'Slave','Zen','Crates','Containers'];
let criticalResources = ['Money','Food'];

function ding() {
    const t = audioCtx.currentTime;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(880, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.18, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    o.connect(g).connect(audioCtx.destination);
    o.start(t); o.stop(t + 0.20);
}

export function computeAlerts() {
    const now = Date.now();
    let match = false;

    for (const r of Object.values(global.resource)) {
        if (ignoredResources.includes(r.name)
                || now - r.timestamp < COOLDOWN_MS
                || !r.display
                || r.max <= 0
                || r.amount === r.max) continue;
        
        if (criticalResources.includes(r.name)
                && r.amount < 100) {
            match = true;
            r.timestamp = now;
            messageQueue(loc(`${r.name} critically low!`), 'warning', true, ['minor_events']);
            continue;
        }

        if ((r.amount / r.max) * 100 >= 90) {
            match = true;
            r.timestamp = now;
            messageQueue(loc(`${r.name} about to cap!`), 'warning', true, ['minor_events']);
            continue;
        }
    }

    if (match && (now - lastDingAt >= COOLDOWN_MS)) {
        lastDingAt = now;
        try { ding(); } catch {}
    }

    return true;
}

export const alerts = { computeAlerts };

function enableAudio() {
    if (!audioCtx) audioCtx = new ACtx();
    if (audioCtx.state === 'suspended') audioCtx.resume().catch(()=>{});
}
function onFirstGesture() {
    enableAudio();
    window.removeEventListener('pointerdown', onFirstGesture);
    window.removeEventListener('keydown', onFirstGesture);
    window.removeEventListener('touchstart', onFirstGesture, { passive: true });
}
window.addEventListener('pointerdown', onFirstGesture, { once: true });
window.addEventListener('keydown', onFirstGesture, { once: true });
window.addEventListener('touchstart', onFirstGesture, { once: true, passive: true });

callback_queue.set([alerts, 'computeAlerts'], []);
