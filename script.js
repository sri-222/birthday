const speechBox = document.getElementById("typewriter");
let audioContext;
const backgroundMusic = new Audio("the_mountain-birthday-490600.mp3");
const backgroundMusicTimeKey = "birthdayBackgroundMusicTime";
const backgroundMusicVolume = 0.16;

backgroundMusic.loop = true;
backgroundMusic.preload = "auto";
backgroundMusic.volume = backgroundMusicVolume;

const restoreBackgroundMusicTime = () => {
  const savedTime = Number(window.localStorage.getItem(backgroundMusicTimeKey));

  if (Number.isFinite(savedTime) && savedTime > 0) {
    backgroundMusic.currentTime = savedTime;
  }
};

const saveBackgroundMusicTime = () => {
  if (Number.isFinite(backgroundMusic.currentTime)) {
    window.localStorage.setItem(backgroundMusicTimeKey, String(backgroundMusic.currentTime));
  }
};

const startBackgroundMusic = async () => {
  try {
    await backgroundMusic.play();
  } catch (error) {
    return;
  }

  document.removeEventListener("pointerdown", startBackgroundMusic);
  document.removeEventListener("keydown", startBackgroundMusic);
};

restoreBackgroundMusicTime();
startBackgroundMusic();
document.addEventListener("pointerdown", startBackgroundMusic, { once: true });
document.addEventListener("keydown", startBackgroundMusic, { once: true });
window.addEventListener("beforeunload", saveBackgroundMusicTime);
window.setInterval(saveBackgroundMusicTime, 1200);

const addCelebrationLayer = () => {
  const celebrationLayer = document.createElement("div");
  celebrationLayer.className = "celebration-layer";
  celebrationLayer.setAttribute("aria-hidden", "true");

  const balloonStyles = ["pink", "cream", "rose", "gold", "coral"];
  balloonStyles.forEach((styleName, index) => {
    const balloon = document.createElement("span");
    balloon.className = `celebration-balloon celebration-balloon-${styleName}`;
    balloon.style.left = `${8 + index * 20}%`;
    balloon.style.animationDelay = `${index * 1.7}s`;
    balloon.style.animationDuration = `${13 + index * 1.2}s`;
    celebrationLayer.appendChild(balloon);
  });

  const paperColors = ["#ff88b3", "#ffd071", "#88d8ff", "#9fe6b8", "#fff0a8", "#f989a7"];
  for (let index = 0; index < 36; index += 1) {
    const paper = document.createElement("span");
    paper.className = "falling-paper";
    paper.style.left = `${(index * 17) % 100}%`;
    paper.style.background = paperColors[index % paperColors.length];
    paper.style.animationDelay = `${(index % 12) * 0.55}s`;
    paper.style.animationDuration = `${7 + (index % 5) * 0.7}s`;
    paper.style.setProperty("--paper-drift", `${index % 2 === 0 ? 24 : -24}px`);
    paper.style.setProperty("--paper-rotate", `${120 + (index % 6) * 38}deg`);
    celebrationLayer.appendChild(paper);
  }

  document.body.prepend(celebrationLayer);
};

addCelebrationLayer();

const getAudioContext = () => {
  if (!window.AudioContext && !window.webkitAudioContext) {
    return null;
  }

  if (!audioContext) {
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioCtor();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  return audioContext;
};

const createTone = (context, {
  frequency,
  startTime,
  duration,
  type = "sine",
  volume = 0.08,
  attack = 0.02,
  release = 0.18,
  detune = 0
}) => {
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startTime);
  oscillator.detune.setValueAtTime(detune, startTime);

  gainNode.gain.setValueAtTime(0.0001, startTime);
  gainNode.gain.linearRampToValueAtTime(volume, startTime + attack);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration + release);

  oscillator.connect(gainNode);
  gainNode.connect(context.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + release + 0.02);
};

const playUnlockSound = () => {
  const context = getAudioContext();
  if (!context) {
    return;
  }

  const start = context.currentTime + 0.02;
  const notes = [
    { frequency: 392.0, offset: 0, duration: 0.2, type: "triangle", volume: 0.05 },
    { frequency: 523.25, offset: 0.16, duration: 0.24, type: "triangle", volume: 0.06 },
    { frequency: 659.25, offset: 0.33, duration: 0.32, type: "sine", volume: 0.08 },
    { frequency: 783.99, offset: 0.48, duration: 0.42, type: "sine", volume: 0.07 }
  ];

  notes.forEach((note, index) => {
    createTone(context, {
      frequency: note.frequency,
      startTime: start + note.offset,
      duration: note.duration,
      type: note.type,
      volume: note.volume,
      attack: 0.015,
      release: 0.28,
      detune: index % 2 === 0 ? -4 : 4
    });
  });

  createTone(context, {
    frequency: 1046.5,
    startTime: start + 0.42,
    duration: 0.5,
    type: "sine",
    volume: 0.045,
    attack: 0.03,
    release: 0.45
  });
};

const playTransitionWhoosh = () => {
  const context = getAudioContext();
  if (!context) {
    return;
  }

  const start = context.currentTime + 0.08;
  const duration = 0.65;
  const bufferSize = context.sampleRate * duration;
  const noiseBuffer = context.createBuffer(1, bufferSize, context.sampleRate);
  const data = noiseBuffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }

  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gainNode = context.createGain();

  source.buffer = noiseBuffer;
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(900, start);
  filter.frequency.exponentialRampToValueAtTime(240, start + duration);
  gainNode.gain.setValueAtTime(0.0001, start);
  gainNode.gain.linearRampToValueAtTime(0.05, start + 0.08);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  source.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(context.destination);
  source.start(start);
  source.stop(start + duration);
};

const triggerPageTransition = (href, delay = 900) => {
  document.body.classList.add("page-transitioning");
  playUnlockSound();
  window.setTimeout(() => {
    playTransitionWhoosh();
  }, 220);

  window.setTimeout(() => {
    window.location.href = href;
  }, delay);
};

if (speechBox) {
  const lines = JSON.parse(speechBox.dataset.lines || "[]");
  let lineIndex = 0;
  let charIndex = 0;

  const type = () => {
    const current = lines[lineIndex] || "";
    speechBox.textContent = current.slice(0, charIndex);

    if (charIndex < current.length) {
      charIndex += 1;
      window.setTimeout(type, 95);
      return;
    }

    window.setTimeout(() => {
      speechBox.textContent = "";
      charIndex = 0;
      lineIndex = (lineIndex + 1) % lines.length;
      window.setTimeout(type, 320);
    }, 2200);
  };

  type();
}

const passwordForm = document.getElementById("passwordForm");
const passwordInput = document.getElementById("passwordInput");
const passwordMessage = document.getElementById("passwordMessage");
const lockCard = document.getElementById("lockCard");
const openCodeButton = document.getElementById("openCodeButton");
const cuteLock = document.getElementById("cuteLock");
let isOpening = false;

if (openCodeButton) {
  openCodeButton.addEventListener("click", () => {
    if (isOpening) {
      return;
    }

    isOpening = true;
    if (lockCard) {
      lockCard.classList.add("is-opening");
    }

    triggerPageTransition("code.html");
  });
}

if (cuteLock) {
  cuteLock.addEventListener("click", (event) => {
    event.preventDefault();
    if (openCodeButton) {
      openCodeButton.click();
    }
  });
}

if (passwordForm && passwordInput && passwordMessage) {
  passwordForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (passwordInput.value.trim().toLowerCase() === "jisi") {
      if (lockCard) {
        lockCard.classList.add("is-verified");
      }

      passwordInput.disabled = true;
      const submitButton = passwordForm.querySelector('button[type="submit"]');
      if (submitButton) {
        submitButton.disabled = true;
      }

      passwordMessage.textContent = "Wish word accepted. Opening your birthday wish...";
      triggerPageTransition("surprise.html");
      return;
    }

    if (lockCard) {
      lockCard.classList.remove("is-verified");
    }

    passwordMessage.textContent = "That wish word is not right yet. Try once more.";
    passwordInput.select();
  });
}

const video = document.getElementById("birthdayVideo");
const startSceneButton = document.getElementById("startSceneButton");
const videoOverlay = document.getElementById("videoOverlay");
const revealSideVideo = document.getElementById("revealSideVideo");

if (video) {
  video.controls = false;
  video.pause();
}

if (startSceneButton && video) {
  startSceneButton.addEventListener("click", async () => {
    if (videoOverlay) {
      videoOverlay.classList.add("is-hidden");
    }

    video.classList.add("is-active");

    video.currentTime = 0;
    video.muted = false;

    try {
      await video.play();
    } catch (error) {
      video.muted = true;
      await video.play();
    }
  });
}

if (video) {
  video.addEventListener("ended", () => {
    window.setTimeout(() => {
      window.location.href = "reveal.html";
    }, 700);
  });
}

if (revealSideVideo) {
  revealSideVideo.loop = true;
  revealSideVideo.volume = 1;
  revealSideVideo.muted = false;

  const startRevealVideo = async () => {
    revealSideVideo.muted = false;

    try {
      await revealSideVideo.play();
    } catch (error) {
      revealSideVideo.controls = true;
    }
  };

  if (revealSideVideo.readyState >= 2) {
    startRevealVideo();
  } else {
    revealSideVideo.addEventListener("loadeddata", startRevealVideo, { once: true });
  }
}
