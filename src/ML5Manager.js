import ml5 from 'ml5';

export default class ML5Manager {

    constructor(resultsCallback) {

        console.log("ML5: Init");
        //store callback function  
        this.resultsCallback = resultsCallback;

        //how many data points are in the JSON?
        //48 hz bins
        const INPUTS_TOTAL = 48;
        const EEG_DATA_SETS = 10;
        const MODEL_TYPE = "classification";

        //setup NN
        let options = {
            inputs: INPUTS_TOTAL,
            outputs: EEG_DATA_SETS,
            task: MODEL_TYPE,
            debug: true,
        };
        this.neuralNetwork = ml5.neuralNetwork(options);
        
        
        //keep this reference for functions and callbacks
        this.trainingModelLoaded = this.trainingModelLoaded.bind(this);
        this.loadTrainingModel()
        
        //make sure this is available inside the stateDetected callback
        this.stateDetected = this.stateDetected.bind(this);

        // Bind keyPressed to ensure 'this' context is preserved
        //this.keyPressed = this.keyPressed.bind(this);
    }

    //MODEL TO CLASSIFY INCOMING EEG DATA (POST TRAINING)
    loadTrainingModel() {
        const modelInfo = {
            model: "/model/model.json",
            metadata: "/model/model_meta.json",
            weights: "/model/model.weights.bin",
        };

        this.neuralNetwork.load(modelInfo, this.trainingModelLoaded);
    }

    trainingModelLoaded() {
        console.log("ML5: Training model is loaded");
    }

    //this is called by a useEffect hook in App.jsx
    classifyLiveEEG(eegSpectrum) {
       //console.log("ML5: Classifying live EEG data", eegSpectrum);
        //only classify if live data is coming from the headset
        if (eegSpectrum.length >= 48) {
            let hzBins = eegSpectrum.slice(0, 48);
            this.neuralNetwork.classify(hzBins, this.stateDetected);
        }
    }

    //minimum confidence
    stateDetected(error, resultsArray) {
        
        //print results
        if (error) {
            console.log("stateDetected error:", error);
            return;
        } else {

            //convert array to object for faster sorting below
            const obj = resultsArray.reduce((obj, item) => {
                obj[item.label] = item;
                return obj;
            }, {});
        
            //muscle is the highest of muscle tension, jaw clench, and blinks
            const muscle = Math.max(
                (obj.m && obj.m.confidence) || 0, //muscle tension
                (obj.j && obj.j.confidence) || 0, //jaw clench
                (obj.b && obj.b.confidence) || 0  //blinks
            );
            //focus is the highest of focus and eye movement
            const focus = Math.max(
                (obj.f && obj.f.confidence) || 0, //focus
                (obj.e && obj.e.confidence) || 0  //eye movement
            );
            const noise = obj.n.confidence; //noise
            const clear = obj.c.confidence; //clear mind
            
            this.resultsCallback(
                {
                    noise: noise,
                    muscle: muscle,
                    focus: focus,
                    clear: clear
                }
            );
        }
    }

    //recording snapshots of EEG data
    // keyPressed(key, eegSpectrum) {
    //     if (key === "S") {
    //         this.neuralNetwork.saveData();
    //     } else if (
    //         key === "n" || 
    //         key === "l" ||
    //         key === "m" ||
    //         key === "j" ||
    //         key === "b" ||
    //         key === "f" || 
    //         key === "e" ||
    //         key === "c" || 
    //         key === "a" || 
    //         key === "d"
    //     ) {
    //         let hzBins = eegSpectrum.slice(0, 48);
    //         let target = [key];
    //         console.log("Store EEG for", key);
    //         console.log(eegSpectrum);
    //         this.neuralNetwork.addData(hzBins, target);
    //     }
    // }
}