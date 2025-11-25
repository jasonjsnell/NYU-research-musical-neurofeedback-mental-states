export function processPPG({ppgSensor, setPPG, ppgSamples}) {

    //console.log(ppgSamples)
    //add decoded samples to the buffer
    const newBuffer = ppgSensor.update(ppgSamples)

    //and return buffer as new array to trigger a useState update
    setPPG(newBuffer);
}
