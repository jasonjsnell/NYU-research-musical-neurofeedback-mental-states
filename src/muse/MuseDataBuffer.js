export default class MuseDataBuffer {

    constructor(length) {
        //save length
        this.maxLength = length;
        //fill buffer with zeroes to length
        this._buffer = new Array(length).fill(0);
    }

    //take a sample set and add to the buffer
    update(withSamples){

        // Check if withSamples is a valid array
        if (Array.isArray(withSamples)) {
            // Add samples to the existing buffer
            this._buffer = [...this._buffer, ...withSamples];
        } else {
            // Log an error or handle the case where 'withSamples' is not an array
            console.log("MuseDataBuffer: Error: withSamples not valid: ", withSamples);
        }

        //keep the buffer the right size
        if (this._buffer.length > this.maxLength) {
            let diff = this._buffer.length - this.maxLength;
            this._buffer.splice(0, diff);//remove the samples at the beginning
        }

        //return updated buffer
        return this._buffer;
    }

    getLength(){
        return this._buffer.length;
    }
}
