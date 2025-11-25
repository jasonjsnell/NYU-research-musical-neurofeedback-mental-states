//ID for muse devices
export const MUSE_SERVICE = 0xfe8d;

export const MUSE_IDS = {
    MUSE_CONTROL_ID: '273e0001-4c4d-454d-96be-f03bac821358',
    MUSE_LEFT_EAR_ID: '273e0003-4c4d-454d-96be-f03bac821358',
    MUSE_LEFT_FOREHEAD_ID: '273e0004-4c4d-454d-96be-f03bac821358',
    MUSE_RIGHT_FOREHEAD_ID: '273e0005-4c4d-454d-96be-f03bac821358',
    MUSE_RIGHT_EAR_ID: '273e0006-4c4d-454d-96be-f03bac821358',
    MUSE_BATTERY_ID: '273e000b-4c4d-454d-96be-f03bac821358',
    MUSE_GYROSCOPE_ID: '273e0009-4c4d-454d-96be-f03bac821358',
    MUSE_ACCELEROMETER_ID: '273e000a-4c4d-454d-96be-f03bac821358',
    MUSE_PPG_ID: '273e0010-4c4d-454d-96be-f03bac821358',
}

export const EEG_SPECTRUM_LENGTH = 64;

//frequency ranges
export const DELTA_F_MIN = 1;
export const DELTA_F_MAX = 4;
export const THETA_F_MIN = 4;
export const THETA_F_MAX = 8;
export const ALPHA_F_MIN = 8;
export const ALPHA_F_MAX = 12;
export const BETA_LOW_F_MIN = 13;
export const BETA_LOW_F_MAX = 15;
export const BETA_MID_F_MIN = 16;
export const BETA_MID_F_MAX = 21;
export const BETA_HIGH_F_MIN = 22;
export const BETA_HIGH_F_MAX = 30;
export const GAMMA_F_MIN = 30;
export const GAMMA_F_MAX = 44;

export const FILTERED_FREQUENCIES = []//[16, 24, 32];

export const PACKET_SIZE = 12;

//note: tone js notes are an octave higher than ableton notes
export const STATE_MUSCLE_NOTE = "C4";
export const STATE_FOCUS_BETA_NOTE = "C4";
export const STATE_FOCUS_GAMMA_NOTE = "C5";
export const STATE_MEDITATION_NOTE = "C3";
export const STATE_DREAM_NOTE = "C3";

export const BAND_NOTES = {
  delta: STATE_MUSCLE_NOTE,        // C4
  theta: STATE_DREAM_NOTE,         // C3
  alpha: STATE_MEDITATION_NOTE,    // C3
  beta : STATE_FOCUS_BETA_NOTE,    // C4
  gamma: STATE_FOCUS_GAMMA_NOTE    // C5
};