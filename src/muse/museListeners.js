//parsing methods
//https://github.com/urish/muse-js/blob/4e864578c55dd7e26d85b429863f47ccabac54a0/src/lib/muse-parse.ts

import { processEEGPair } from './museEEG';
import { parseImuReading } from "./museParser";
import { decodeUnsigned12BitData } from './museParser.js';
import { decodeUnsigned24BitData } from "./museParser";
import { processPPG } from "./musePPG";

//streaming listeners
//eeg 0=left ear, 1=left forehead, 2=right forehead, 3=right ear
//discluding the ears, 0 and 3, because they're too noisy) 
//so only using streams 1 and 2 from device

//throttle
var throttleEEGLeft = true;
// Shared state
let bufferedLeft = null;
let bufferedRight = null;
let _leftSensor = null;
let _rightSensor = null;
let _eegUpdateHandler = null;

export function didReceiveEegLeftForehead({ leftSensor, rightSensor, eegUpdateHandler, data }) {

    if (throttleEEGLeft) {

        // Initialize shared pointers
        _leftSensor = leftSensor;
        _rightSensor = rightSensor;
        _eegUpdateHandler = eegUpdateHandler;
    
        const eegSamples = decodeUnsigned12BitData(new Uint8Array(data.buffer).subarray(2));
        bufferedLeft = eegSamples;

        tryProcessEEGPair();

        throttleEEGLeft = false;
    } else {
        throttleEEGLeft = true;
    }
}

var throttleEEGRight = true;
export function didReceiveEegRightForehead({ leftSensor, rightSensor, eegUpdateHandler, data }) {

    //print out each data pack on its own line


    if (throttleEEGRight) {
        
        _leftSensor = leftSensor;
        _rightSensor = rightSensor;
        _eegUpdateHandler = eegUpdateHandler;  

        const eegSamples = decodeUnsigned12BitData(new Uint8Array(data.buffer).subarray(2));
        bufferedRight = eegSamples;

        tryProcessEEGPair();

        throttleEEGRight = false;
    } else {
        throttleEEGRight = true;
    }

}

function tryProcessEEGPair() {

    if (bufferedLeft && bufferedRight) {

        processEEGPair({
            leftSensor: _leftSensor,
            rightSensor: _rightSensor,
            eegLeftSamples: bufferedLeft,
            eegRightSamples: bufferedRight,
            eegUpdateHandler: _eegUpdateHandler
        });

        // Reset buffers
        bufferedLeft = null;
        bufferedRight = null;
    }
}

let throttlePPG = true;
export function didReceivePpg({ ppgSensor, setPPG, data }) {

    if (throttlePPG) {

        //24 bit processing for PPG data
        let ppgSamples = decodeUnsigned24BitData(new Uint8Array(data.buffer).subarray(2));

        processPPG({
            ppgSensor,
            setPPG,
            ppgSamples
        });

        throttlePPG = false;
    } else {
        throttlePPG = true;
    }
}

//process every other accel package
var throttleAccel = true;
export function didReceiveAccel({ setData, data }) {

    if (throttleAccel) {

        //parse the samples with multiplier
        let _samples = parseImuReading(data, 0.0000610352).samples;

        const accel = {};
        //average out the samples
        accel.x = (_samples[0].x + _samples[1].x + _samples[2].x) / 3;
        accel.y = (_samples[0].y + _samples[1].y + _samples[2].y) / 3;
        accel.z = (_samples[0].z + _samples[1].z + _samples[2].z) / 3;
        //console.log("Accel:", accel);

        setData(accel);

        throttleAccel = false;
    } else {
        throttleAccel = true;
    }
}

export function didReceiveBattery({ setData, data }) {
    const batteryLevel = data.getUint16(2) / 512;
    console.log("Battery level:", batteryLevel, "%");
    setData(batteryLevel);
}
