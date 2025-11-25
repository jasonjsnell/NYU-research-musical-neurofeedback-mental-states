import { EEG_SPECTRUM_LENGTH, DELTA_F_MIN, DELTA_F_MAX, THETA_F_MIN, THETA_F_MAX, ALPHA_F_MIN, ALPHA_F_MAX, BETA_LOW_F_MIN, BETA_HIGH_F_MAX, GAMMA_F_MIN, GAMMA_F_MAX } from './museConstants';
// import { STATE_MUSCLE, STATE_DREAM, STATE_MEDIT, STATE_FOCUS } from './museConstants';
// import { STATE_MUSCLE_NOTE, STATE_DREAM_NOTE, STATE_MEDITATION_NOTE, STATE_FOCUS_BETA_NOTE, STATE_FOCUS_GAMMA_NOTE } from './museConstants';
import EEGPeakDetector from './MuseEEGPeakDetector';

// Helper: calculate average power in a spectrum slice
function averageBandPower(spectrum, fMin, fMax) {
    const start = fMin;
    const end = Math.min(fMax + 1, spectrum.length); // +1 to include upper edge
    const slice = spectrum.slice(start, end);
    const sum = slice.reduce((acc, v) => acc + v, 0);
    return slice.length ? sum / slice.length : 0;
}


export function processEEGPair({
    leftSensor,
    rightSensor,
    eegLeftSamples,
    eegRightSamples,
    eegUpdateHandler
}) {

    //PSDs
    leftSensor.update(eegLeftSamples); // eegLeftSamples
    rightSensor.update(eegRightSamples); // eegRightSamples

    const leftFiltered = leftSensor.filteredSpectrum.slice(0, EEG_SPECTRUM_LENGTH);
    const leftRaw = leftSensor.rawSpectrum.slice(0, EEG_SPECTRUM_LENGTH);
    const rightFiltered = rightSensor.filteredSpectrum.slice(0, EEG_SPECTRUM_LENGTH);
    const rightRaw = rightSensor.rawSpectrum.slice(0, EEG_SPECTRUM_LENGTH);

    // BRAINWAVES
    // calc brainwaves bands
    const brainwaves = calculateBrainwaves(leftSensor, rightSensor);

    //PEAK DETECTION
    //update histories
    updateEEGHistories(brainwaves);
    const peaks = runEEGPeakDetectors();

    //send back up to App
    eegUpdateHandler({
        newEEGLeftRaw: leftRaw,
        newEEGLeftFiltered: leftFiltered,
        newEEGRightRaw: rightRaw,
        newEEGRightFiltered: rightFiltered,
        newBrainwaves: brainwaves,
        newPeaks: peaks
    });

}

//brainwaves
function calculateBrainwaves(leftSensor, rightSensor) {

    if (!leftSensor || !rightSensor) return;

    const left = leftSensor.filteredSpectrum;
    const right = rightSensor.filteredSpectrum;

    if (!left.length || !right.length) return;

    const avg = (a, b) => (a + b) / 2;

    return {
        delta: avg(
            averageBandPower(left, DELTA_F_MIN, DELTA_F_MAX),
            averageBandPower(right, DELTA_F_MIN, DELTA_F_MAX)
        ),
        theta: avg(
            averageBandPower(left, THETA_F_MIN, THETA_F_MAX),
            averageBandPower(right, THETA_F_MIN, THETA_F_MAX)
        ),
        alpha: avg(
            averageBandPower(left, ALPHA_F_MIN, ALPHA_F_MAX),
            averageBandPower(right, ALPHA_F_MIN, ALPHA_F_MAX)
        ),
        beta: avg(
            averageBandPower(left, BETA_LOW_F_MIN, BETA_HIGH_F_MAX),
            averageBandPower(right, BETA_LOW_F_MIN, BETA_HIGH_F_MAX)
        ),
        gamma: avg(
            averageBandPower(left, GAMMA_F_MIN, GAMMA_F_MAX),
            averageBandPower(right, GAMMA_F_MIN, GAMMA_F_MAX)
        )
    }
}

//EEG histories
const MAX_HISTORY = 75;

const histories = {
    delta: [],
    theta: [],
    alpha: [],
    beta: [],
    gamma: []
};

function updateEEGHistories(brainwaves) {
    Object.entries(brainwaves).forEach(([band, value]) =>
        pushHistory(band, value)
    );
}

function pushHistory(band, value) {
    const h = histories[band];
    h.push(value);
    if (h.length > MAX_HISTORY) h.shift();
}


//peak detection 

function runEEGPeakDetectors() {
  
  const results = {
    delta: peakDetectors.delta.detectPeak(histories.delta),
    theta: peakDetectors.theta.detectPeak(histories.theta),
    alpha: peakDetectors.alpha.detectPeak(histories.alpha),
    beta:  peakDetectors.beta.detectPeak(histories.beta),
    gamma: peakDetectors.gamma.detectPeak(histories.gamma)
  };

  return results;
}

const peakDetectors = {
    delta: new EEGPeakDetector({
        threshold: 0.99,
        spacingBetweenEvents: 25
    }),
    theta: new EEGPeakDetector({
        threshold: 0.30,
        spacingBetweenEvents: 250
    }),
    alpha: new EEGPeakDetector({
        threshold: 0.30,
        spacingBetweenEvents: 250
    }),
    beta: new EEGPeakDetector({
        threshold: 0.8,
        spacingBetweenEvents: 10
    }),
    gamma: new EEGPeakDetector({
        threshold: 0.8,
        spacingBetweenEvents: 10
    })
};

