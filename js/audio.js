/**
 * SmartQueue - Audio & Voice Announcement Engine
 * Uses Web Audio API for chime chords and Web Speech API for Thai voice announcements.
 */

const QueueAudio = {
  audioCtx: null,
  isMuted: false,

  // Initialize Web Audio context on user interaction
  initAudio() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  },

  // Play pleasant Ding-Dong / Airport Chime
  playChime() {
    if (this.isMuted) return Promise.resolve();

    return new Promise((resolve) => {
      try {
        this.initAudio();
        if (!this.audioCtx) return resolve();

        const ctx = this.audioCtx;
        const now = ctx.currentTime;

        // Notes: G5 (783.99Hz) -> E5 (659.25Hz) -> C5 (523.25Hz)
        const notes = [
          { freq: 783.99, start: 0, duration: 0.35 },
          { freq: 659.25, start: 0.25, duration: 0.35 },
          { freq: 523.25, start: 0.5, duration: 0.7 }
        ];

        notes.forEach(({ freq, start, duration }) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + start);

          // Envelope
          gain.gain.setValueAtTime(0, now + start);
          gain.gain.linearRampToValueAtTime(0.28, now + start + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.001, now + start + duration);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + start);
          osc.stop(now + start + duration);
        });

        setTimeout(resolve, 1100);
      } catch (e) {
        console.warn('Audio chime error:', e);
        resolve();
      }
    });
  },

  // Announce Queue in Thai Voice
  speakQueue(queueNumber, counterNumber) {
    if (this.isMuted) return;

    if (!('speechSynthesis' in window)) {
      console.log('Speech synthesis not supported in this browser');
      return;
    }

    // Split letters & numbers for clear pronunciation
    // E.g., "A002" -> "เอ ศูนย์ ศูนย์ สอง"
    const thaiDigits = {
      '0': 'ศูนย์',
      '1': 'หนึ่ง',
      '2': 'สอง',
      '3': 'สาม',
      '4': 'สี่',
      '5': 'ห้า',
      '6': 'หก',
      '7': 'เจ็ด',
      '8': 'แปด',
      '9': 'เก้า'
    };

    const prefix = queueNumber.charAt(0);
    const digits = queueNumber.slice(1).split('').map(d => thaiDigits[d] || d).join(' ');

    const textToSpeak = `ขอเชิญหมายเลขคิว ${prefix} ${digits} ที่ช่องบริการ ${counterNumber} ค่ะ`;

    window.speechSynthesis.cancel(); // Stop any pending speech

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'th-TH';
    utterance.rate = 0.95;
    utterance.pitch = 1.05;

    // Try to find a Thai voice if available
    const voices = window.speechSynthesis.getVoices();
    const thaiVoice = voices.find(v => v.lang.startsWith('th'));
    if (thaiVoice) {
      utterance.voice = thaiVoice;
    }

    window.speechSynthesis.speak(utterance);
  },

  // Combined Chime + Speech Callout
  async announce(queueNumber, counterNumber) {
    await this.playChime();
    this.speakQueue(queueNumber, counterNumber);
  },

  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }
};

window.QueueAudio = QueueAudio;
