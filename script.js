const speechBox = document.getElementById("typewriter");
const releaseDate = new Date(2026, 5, 2, 0, 0, 0, 0);
const releasePage = "index.html";
const currentPath = window.location.pathname.split("/").pop() || releasePage;
const isReleaseLocked = new Date() < releaseDate;
let audioContext;
const backgroundMusic = new Audio("the_mountain-birthday-490600.mp3");
const backgroundMusicTimeKey = "birthdayBackgroundMusicTime";
const backgroundMusicVolume = 0.16;

const formatCountdown = (distance) => {
  const totalSeconds = Math.max(0, Math.floor(distance / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  }

  return `${hours}h ${minutes}m ${seconds}s`;
};

const activateReleaseCountdown = () => {
  const lockIntro = document.getElementById("lockIntro");
  const openCodeButton = document.getElementById("openCodeButton");

  if (!lockIntro) {
    return;
  }

  const microCopy = lockIntro.querySelector(".micro-copy");
  const title = lockIntro.querySelector("h1");
  const lead = lockIntro.querySelector(".lead");
  let countdownMessage = lockIntro.querySelector("#countdownMessage");

  if (microCopy) {
    microCopy.textContent = "A little wish is resting";
  }

  if (title) {
    title.textContent = "Your birthday surprise is sleeping for a little while longer.";
  }

  if (lead) {
    lead.textContent = "When the clock softly turns to 12:00 AM, your birthday surprise will opens.";
  }

  if (openCodeButton) {
    openCodeButton.disabled = true;
    openCodeButton.setAttribute("aria-disabled", "true");
    openCodeButton.title = "Available at midnight between June 1 and June 2";
  }

  if (!countdownMessage) {
    countdownMessage = document.createElement("p");
    countdownMessage.id = "countdownMessage";
    countdownMessage.className = "countdown-message";
    lockIntro.appendChild(countdownMessage);
  }

  const updateCountdown = () => {
    const distance = releaseDate.getTime() - Date.now();

    if (distance <= 0) {
      countdownMessage.textContent = "The birthday surprise is awake now... opening in a moment.";
      window.setTimeout(() => {
        window.location.reload();
      }, 900);
      return;
    }

    countdownMessage.textContent = `It will wake up in ${formatCountdown(distance)}.`;
  };

  updateCountdown();
  window.setInterval(updateCountdown, 1000);
};

if (isReleaseLocked) {
  if (currentPath !== "" && currentPath !== releasePage) {
    window.location.replace(releasePage);
  } else {
    activateReleaseCountdown();
  }
}

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
    if (isReleaseLocked) {
      return;
    }

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

    if (isReleaseLocked) {
      passwordMessage.textContent = "The wish is still dreaming a little longer. It will open at midnight between June 1 and June 2.";
      return;
    }

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
  video.playsInline = true;
}

if (startSceneButton && video) {
  startSceneButton.addEventListener("click", async () => {
    if (videoOverlay) {
      videoOverlay.classList.add("is-hidden");
    }

    video.classList.add("is-active");

    backgroundMusic.pause();
    saveBackgroundMusicTime();
    video.currentTime = 0;
    video.volume = 1;
    video.defaultMuted = false;
    video.muted = false;
    video.removeAttribute("muted");

    try {
      await video.play();
    } catch (error) {
      video.muted = true;

      try {
        await video.play();
      } catch (fallbackError) {
        video.controls = true;
        if (videoOverlay) {
          videoOverlay.classList.remove("is-hidden");
        }
      }
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
