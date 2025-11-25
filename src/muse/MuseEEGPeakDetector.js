// ----------------------------------------------------------
export default class EEGPeakDetector {
  constructor({
    threshold,
    spacingBetweenEvents,
  } = {}) {
    this.threshold            = threshold;
    this.spacingBetweenEvents = spacingBetweenEvents;

    this.timeSinceLastTrigger = 0;
    this.noteOn               = false;
  }

  detectPeak(history) {

    if (history.length < 10) { 
        //console.warn("PEAK: Not enough data points to detect peak");
        return -1; 
    }

    const currentValue = history.at(-1);
    const min          = Math.min(...history);
    const max          = Math.max(...history);
    const range        = max - min;
    if (range === 0) {
        //console.warn("PEAK: No range in data points");
        return -1;
    }

    const currPct = (currentValue - min) / range;
    if (!Number.isFinite(currPct)) {
        //console.warn("PEAK: Current percentage is not finite");
        return -1;
    }

    this.timeSinceLastTrigger++;

    if (currPct > this.threshold) {
      if (!this.noteOn && this.timeSinceLastTrigger > this.spacingBetweenEvents) {
        
        this.noteOn               = true;
        this.timeSinceLastTrigger = 0;
        
        //console.log("PEAK: note on", currPct);
        return currPct; // trigger
      }
      //console.log("PEAK: note hold");
      return -1; // hold
    }

    // below threshold
    if (this.noteOn) {
      this.noteOn = false;
      //console.log("PEAK: note off", currPct);
      return 0; // release
    }
    //console.log("PEAK: no event", currPct);
    return -1; // no event
  }
}
