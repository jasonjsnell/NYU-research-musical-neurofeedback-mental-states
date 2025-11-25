import React, { useEffect, useRef, useState } from 'react';
import './App.css';

//muse

import MuseOSC from "./muse/MuseOSC";
import MuseEEGSensor from "./muse/MuseEEGSensor";
import { EEG_SPECTRUM_LENGTH } from "./muse/museConstants";
import ML5Manager from "./ML5Manager";

import Visualizer from './Visualizer';

//MIDI
import MidiManager from './midi/MidiManager';


let muse;

function App() {

  //OSC data from Muse Lab
  const wsRef = useRef(null);

  useEffect(() => {
    wsRef.current = new WebSocket("ws://localhost:8081");

    wsRef.current.onmessage = (evt) => {
      const pkt = JSON.parse(evt.data);
    };

    return () => wsRef.current && wsRef.current.close();
  }, []);

  //MUSE brain
  const [brainwaves, setBrainwaves] = useState({ delta: 0, theta: 0, alpha: 0, beta: 0, gamma: 0 });
  const [eegDisplaySpectrum, setEEGDisplaySpectrum] = useState(Array(EEG_SPECTRUM_LENGTH).fill(0));
  const [eegLeftFiltered, setEEGLeftFiltered] = useState(Array(EEG_SPECTRUM_LENGTH).fill(0));
  const [eegRightFiltered, setEEGRightFiltered] = useState(Array(EEG_SPECTRUM_LENGTH).fill(0));
  const [eegLeftRaw, setEEGLeftRaw] = useState(Array(EEG_SPECTRUM_LENGTH).fill(0));
  const [eegRightRaw, setEEGRightRaw] = useState(Array(EEG_SPECTRUM_LENGTH).fill(0));
  const eegLeftForeheadSensor = new MuseEEGSensor();
  const eegRightForeheadSensor = new MuseEEGSensor();
  const [peaks, setPeaks] = useState({ delta: -1, theta: -1, alpha: -1, beta: -1, gamma: -1 });

  //ML5
  const [eegStates, setEEGStates] = useState({ noise: 0, muscle: 0, clear: 0, focus: 0 });

  //MIDI
  const midiManagerRef = useRef(null);
  useEffect(() => {
    midiManagerRef.current = new MidiManager();
  }, []);


  // MARK: EEG -------------- //

  useEffect(() => {
    if (midiManagerRef.current) {
      midiManagerRef.current.updateMidiWithBrainwaves(brainwaves); // Pass the brainwaves object
    }
  }, [brainwaves]);

  useEffect(() => {
    if (midiManagerRef.current) {
      midiManagerRef.current.updateMidiWithPeaks(peaks);
    }
  }, [peaks]);

  const handleEEGUpdate = ({
    newEEGLeftRaw,
    newEEGLeftFiltered,
    newEEGRightRaw,
    newEEGRightFiltered,
    newBrainwaves,
    newPeaks
  }) => {


    //set the eeg spectrums, raw and filtered
    //raw goes to ML, filtered goes to display
    setEEGLeftFiltered(newEEGLeftFiltered);
    setEEGLeftRaw(newEEGLeftRaw);
    setEEGRightFiltered(newEEGRightFiltered);
    setEEGRightRaw(newEEGRightRaw);

    //set the brainwaves and peaks
    setBrainwaves(newBrainwaves);
    setPeaks(newPeaks);

  };

  //MuseDirect -> MuseLab -> OSC
  const connectViaOSC = () => {
    new MuseOSC({
      eegLeftForeheadSensor: eegLeftForeheadSensor,
      eegRightForeheadSensor: eegRightForeheadSensor,
      eegUpdateHandler: handleEEGUpdate
    });
  };

  useEffect(() => {

    //if eeg L and R sensors are streaming data
    if (
      Array.isArray(eegLeftFiltered) && eegLeftFiltered.length > 0 &&
      Array.isArray(eegRightFiltered) && eegRightFiltered.length > 0 &&
      typeof eegLeftFiltered[0] === 'number' &&
      typeof eegRightFiltered[0] === 'number'
    ) {

      //get average of the two arrays, eegLeft and eegRight
      //use this for the ML5 detection
      const rawAvg = [];
      
      for (let i = 0; i < EEG_SPECTRUM_LENGTH; i++) {
        rawAvg[i] = (eegLeftRaw[i] + eegRightRaw[i]) / 2;
      }


      setEEGDisplaySpectrum(eegLeftFiltered.map((v, i) => (v + eegRightFiltered[i]) / 2)); // keep filtered display

      // use raw spectrum for ML
      if (ml5Ref.current) {
        ml5Ref.current.classifyLiveEEG(rawAvg);
      }

    }

  }, [eegLeftFiltered]);


  // MARK: ML5 -------------- //

  const handleML5Results = (results) => {
    setEEGStates(results);
  };

  useEffect(() => {
    if (midiManagerRef.current) {
      midiManagerRef.current.updateMidiWithEEGStates(eegStates); // Pass the eegStates object
    }
  }, [eegStates]);


  // Log the state after it updates
  const ml5Ref = useRef(null);

  useEffect(() => {
    ml5Ref.current = new ML5Manager(handleML5Results);
  }, []);



  // INTERFACE ----- //

  return (
    <div style={{ position: 'relative', padding: '20px' }}>
      <h2>Musical Neurofeedabck and Mental State</h2>

      <div className="button-group">

        <button onClick={() => {
          connectViaOSC();
        }}>Connect via MuseLab OSC</button>

      </div>
      <br></br>
      <Visualizer filteredSpectrum={eegDisplaySpectrum} eegStates={eegStates} />
    </div>

  );
}

export default App;