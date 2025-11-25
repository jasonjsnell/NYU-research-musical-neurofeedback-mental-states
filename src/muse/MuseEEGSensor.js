import MuseDataBuffer from "./MuseDataBuffer";
import FFT from "./FFT";
import { FILTERED_FREQUENCIES } from "./museConstants";

export default class MuseEEGSensor {
    constructor() {

        //data buffer
        this.EEG_BUFFER_SIZE = 256;
        this.buffer = new MuseDataBuffer(this.EEG_BUFFER_SIZE);

        //fft to process time based samples in buffer into a frequency based spectrum
        let MUSE_SAMPLE_RATE = 256;
        this.fft = new FFT(this.EEG_BUFFER_SIZE, MUSE_SAMPLE_RATE);

        //and store the whole spectrum var for screen printing, etc...
        this.rawSpectrum = new Array(this.EEG_BUFFER_SIZE/2).fill(0);
        this.filteredSpectrum = new Array(this.EEG_BUFFER_SIZE/2).fill(0);
    }

    //update from sensor
    update(withSamples) {

        //add new samples to buffer
        let sensorBuffer = this.buffer.update(withSamples)

        //turn samples into a frequency spectrum using FFT
        const spectrum = this.fft.forward(sensorBuffer);

        // Apply bSi scaling only to rawSpectrum for ML compatibility
        const bSi = 2 / this.fft.bufferSize;
        this.rawSpectrum = spectrum.map(val => val * bSi);

        //console.log("rawSpectrum", this.rawSpectrum[1]);

        //grab the specturm (without bSI) and filter it
        const _filteredSpectrum = [...spectrum];

        // Apply frequency filters by zeroing those bins
        FILTERED_FREQUENCIES.forEach((bin) => {
            if (bin >= 0 && bin < _filteredSpectrum.length) {
                _filteredSpectrum[bin] = 0;
            }
        });
        //console.log("_filteredSpectrum", _filteredSpectrum[1]);

        // now create a 64-bin dB-normalized version for visualization
        const _dBFiltered = _filteredSpectrum.slice(0, 64).map((val) => {
            const magSquared = val * val;
            return 10 * Math.log10(magSquared + 1e-6); // Avoid log(0)
        });

        //console.log("_dBFiltered:", _dBFiltered[1]);

        this.filteredSpectrum = _dBFiltered;
    }
}
