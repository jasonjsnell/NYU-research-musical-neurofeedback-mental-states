import { stepTowardMIDI, clampMIDI } from './midiUtils';

export default class MidiManager {

    constructor() {
        console.log("MIDI: Init MidiManager");

        // Placeholder properties
        this.output = null;
        this.currSong = null;

        // state values
        this.noise = 0;
        this.muscle = 0;
        this.clear = 0;
        this.focus = 0;

        this.delta = 0;
        this.theta = 0;
        this.alpha = 0;
        this.beta = 0;
        this.gamma = 0;

        // smoothed CC values (0-127)
        this.ccLP = 127; // CC21
        this.ccReverb = 64;  // CC22

        this.initMidi();
    }

    /* ─────────────── Web MIDI setup ─────────────── */
    initMidi() {
        if (!navigator?.requestMIDIAccess) {
            console.warn("Web MIDI not supported in this browser");
            return;
        }

        navigator.requestMIDIAccess({ sysex: false })
            .then((midiAccess) => {
                // Pick the first output; adjust if you need a specific one
                const outputs = [...midiAccess.outputs.values()];
                if (outputs.length === 0) {
                    console.warn("Web MIDI: No outputs found");
                    return;
                }
                this.output = outputs[0];
                console.log(`Web MIDI: Connected to "${this.output.name}"`);
            })
            .catch((err) => console.error("Web MIDI failed:", err));
    }

    /* ─────────────── low-level send helpers ─────────────── */
    sendCC(ccNum, val, channel = 0) {
        if (!this.output) return;
        const v = clampMIDI(val);
        this.output.send([0xB0 + channel, ccNum, v]);
    }

    sendNoteOn(note, velocity = 64, channel = 0, lenMs = 200) {
        if (!this.output) return;
        const vel = clampMIDI(velocity);
        const now = window.performance.now();
        this.output.send([0x90 + channel, note, vel], now);
        // auto note-off after lenMs
        this.output.send([0x80 + channel, note, 0], now + lenMs);
    }


    async playSong(songID) {
        this.currSong = songID;
        console.log("MIDI: playSong", songID);
    }

    stopSong() {
        console.log("MIDI: stopSong");
        this.currSong = null;
    }

     updateMidiWithBrainwaves(brainwaves) {

        //save brainwaves data obj
        this.delta = brainwaves.delta;
        this.theta = brainwaves.theta;
        this.alpha = brainwaves.alpha;
        this.beta = brainwaves.beta;
        this.gamma = brainwaves.gamma;

        //console.log("AUDIO: Brainwaves total", totalEnergy);

        let lpTargetHz = 15_000; //default target
        let reverbTarget = 0.5; //default target
        let reverbStep = 1; //default step

        //if noise is under threshold
        if (this.noise < 0.8) {

            //console.log("AUDIO: muscle", Math.round(this.muscle * 100), "Clear", Math.round(this.clear * 100), "Focus", Math.round(this.focus * 100));

            //if muscle activity is under threshold
            if (this.muscle < 0.8) {

                const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
                const lerp  = (t, min, max)  => min + (max - min) * t;

                const focusClearRatio = (this.clear > 0)
                    ? (this.focus / this.clear) * 100           //  e.g. 10-120
                    : 120;                                      //  worst-case fallback

                //console.log("AUDIO: focusClearRatio", Math.round(focusClearRatio));

                const norm = clamp((focusClearRatio - 10) / (120 - 10), 0, 1);

                /* 3.  map to target values */
                lpTargetHz   = lerp(norm,  500, 15_000);          //  500 Hz → 15 kHz
                reverbTarget = lerp(1 - norm, 0.40, 0.95);        //  40 %  → 95 % wet
                /*                 ^ invert so meditation ⇒ more reverb */

                reverbStep   = norm < 0.25 ? 1 : 2; 
                
            } else {
                //muscle tension is high, cut the reverb
                lpTargetHz = 15_000;
                reverbTarget = 0.4;
                reverbStep = 4;
            }


        } else {

            //noise is significant
            //reduce reverb, open highs
            lpTargetHz = 15_000;
            reverbTarget = 0.3;
            reverbStep = 4;

        }

        /* Mapping */
        const targetLPCC = Math.round((lpTargetHz / 15_000) * 127);
        const targetReverbCC = Math.round(reverbTarget * 127);

        /* Smooth toward targets */
        this.ccLP = stepTowardMIDI(this.ccLP, targetLPCC, 1);
        this.ccReverb = stepTowardMIDI(this.ccReverb, targetReverbCC, reverbStep);

        /* Send CC only if they changed */
        this.sendCC(21, this.ccLP);     // Low-pass
        this.sendCC(22, this.ccReverb); // Reverb wet

        //console.log("AUDIO: Brainwaves", Math.round(brainwaves.delta), Math.round(brainwaves.theta), Math.round(brainwaves.alpha), Math.round(brainwaves.beta), Math.round(brainwaves.gamma));

    }

    updateMidiWithPeaks(peaks) {
        // Gate for noise
        if (this.noise > 0.9) {
            return;
        }

        Object.entries(peaks).forEach(([band, val], index) => {
            if (val <= 0) return;

            // gating logic
            //if clear is high when in beta or gamma, don't play
            if ((band === "beta" || band === "gamma") && this.clear > 0.5) return;

            //if alpha is high when muscle is high, don't play (alpha is a muscle artifact)
            if (band === "alpha" && this.muscle > 0.3) return;

            const note = 60; // You can customize per band if needed
            const velocity = clampMIDI(Math.round(val * 127));

            // MIDI channels 0–15 only
            const channel = Math.min(index, 15);

            //console.log(`MIDI: Sending NoteOn for ${band} at channel ${channel+1}, note ${note}, velocity ${velocity}`);
            this.sendNoteOn(note, velocity, channel);
        });
    }


    updateMidiWithEEGStates(eegStates) {
        this.noise = eegStates.noise;
        this.muscle = eegStates.muscle;
        this.clear = eegStates.clear;
        this.focus = eegStates.focus;

        //console.log("MIDI: updateMidiWithEEGStates", eegStates);
    }
}
