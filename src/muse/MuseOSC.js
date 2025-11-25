// museOSC.js  ────────────────────────────────────────────────────────────
// Listens to the WS bridge (localhost:8081) that forwards MuseLab's OSC.
// Converts each OSC /eeg packet into sample arrays identical to what
// didReceiveEegLeftForehead / didReceiveEegRightForehead produced.

// imports already in your codebase
import { processEEGPair } from "./museEEG";
import { PACKET_SIZE } from "./museConstants"; // 12 samples per BLE packet

export default class MuseOSC {


    constructor({
        eegLeftForeheadSensor,
        eegRightForeheadSensor,
        eegUpdateHandler
    }) {
      
        this.leftSensor = eegLeftForeheadSensor;
        this.rightSensor = eegRightForeheadSensor;
        this.eegUpdateHandler = eegUpdateHandler;

        //throttle incoming messages to half
        this.throttleOSC = true;

        // internal buffers
        this.leftBuf = [];
        this.rightBuf = [];

        this.ws = new WebSocket("ws://localhost:8081");
        this.ws.onopen = () => {
            console.log("MuseOSC: WebSocket connected");
        };
        this.ws.onclose = () => {
            console.log("MuseOSC: WebSocket closed");
        };
        this.ws.onmessage = this.handleMessage.bind(this);
    }

    handleMessage(evt) {

        //throttle incoming messages to half
        if (this.throttleOSC) {

            //console.log("MuseOSC: Received message", evt.data);

            const pkt = JSON.parse(evt.data);
            if (!pkt.address.endsWith("/eeg")) return;

            // MuseLab order: [TP9, AF7, AF8, TP10, AUXR, AUXL]
            const vals = pkt.args.map((a) => a.value);
            const af7 = vals[1];   // left forehead
            const af8 = vals[2];   // right forehead

            this.leftBuf.push(af7);
            this.rightBuf.push(af8);

            // When we have 12 samples (≈ one BLE packet) process the pair
            if (this.leftBuf.length >= PACKET_SIZE && this.rightBuf.length >= PACKET_SIZE) {
                processEEGPair({
                    leftSensor: this.leftSensor,
                    rightSensor: this.rightSensor,
                    eegLeftSamples: this.leftBuf.splice(0),   // pass & clear
                    eegRightSamples: this.rightBuf.splice(0),
                    eegUpdateHandler: this.eegUpdateHandler
                });
            }

            this.throttleOSC = false;

        } else {
            this.throttleOSC = true;
        }
    }
}
