// Visualizer.jsx
import React, { useRef, useEffect, useCallback } from 'react';
import Sketch from 'react-p5';
import { FILTERED_FREQUENCIES } from './muse/museConstants'; // Assuming you have a constants file


const Visualizer = React.memo(({ filteredSpectrum, eegStates }) => {

  //eeg states
  const eegStatesRef = useRef(eegStates);
  useEffect(() => {
    eegStatesRef.current = eegStates;
  }, [eegStates]);

  // spectrum data
  const specRef = useRef([]);
  const peakYRef = useRef([]);
  useEffect(() => {
    specRef.current = filteredSpectrum;
  }, [filteredSpectrum]);




  const setup = useCallback((p5, parent) => {
    p5.createCanvas(750, 300).parent(parent);
    p5.frameRate(30);
    p5.noFill();
    peakYRef.current = [0, 0, 0, 0, 0];
  }, []);

  const draw = useCallback((p5) => {
    const spec = specRef.current;
    if (!spec.length) {
      p5.background(0);
      return;
    }

    const w = p5.width;
    const h = p5.height;
    const binW = w / spec.length;

    const MIN_VAL = 30;
    const MAX_VAL = 90;
   
    p5.background(0);
    p5.noStroke();

    // Clear fill before drawing line
    p5.noFill();
    p5.stroke(255);
    p5.strokeWeight(1.5);

    // Draw line for the spectrum
    p5.beginShape();
    spec.forEach((mag, i) => {
      const norm = p5.constrain((mag - MIN_VAL) / (MAX_VAL - MIN_VAL), 0, 1);
      const y = p5.map(norm, 0, 1, h, 0);
      const x = i * binW;
      p5.vertex(x, y);
    });
    p5.endShape();

    // Draw filter dots at bottom
    p5.fill(255, 0, 0);
    p5.noStroke();
    FILTERED_FREQUENCIES.forEach((binIndex) => {
      if (binIndex >= 0 && binIndex < spec.length) {
        const x = binIndex * binW;
        const y = h - 4; // slightly above the bottom
        p5.ellipse(x, y, 6, 6); // small circle
      }
    });


    // --- EEG STATES: NOISE & MUSCLE ---

    // EEG states Dot
    const { noise, muscle, clear, focus } = eegStatesRef.current;

    const dotRadius = 8;
    const dotSpacing = 15;
    const cornerX = p5.width - 50;
    const baseY = 20;

    const dotData = [
      { label: "Noise", value: noise, color: [147, 32, 21] },
      { label: "Muscle", value: muscle, color: [147, 32, 21] },
      { label: "Clear", value: clear, color: [59, 134, 180] },
      { label: "Focus", value: focus, color: [101, 135, 36] },
    ];


    p5.noStroke();

    p5.textAlign(p5.LEFT, p5.CENTER);
    p5.textSize(10);


    dotData.forEach((item, i) => {
      const alpha = p5.constrain(item.value * 255, 0, 255);
      p5.fill(...item.color, alpha);
      const y = baseY + i * dotSpacing;
      p5.noStroke();
      p5.ellipse(cornerX, y, dotRadius, dotRadius);

      p5.fill(255);
      p5.text(item.label, cornerX + dotRadius + 4, y);
    });

  }, []);

  return <Sketch setup={setup} draw={draw} />;
});

export default Visualizer;
