const $ = id => document.getElementById(id);

const audio = $("audioPlayer");
const volumeSlider = $("volumeSlider");
const volumeValue = $("volumeValue");
const playBtn = $("playBtn");
const musicFile = $("musicFile");
const visualizer = $("visualizer");

let audioContext = null;
let source = null;
let masterGain = null;
let bassFilter = null;
let midFilter = null;
let trebleFilter = null;
let bassBoostGain = null;
let delayNode = null;
let echoGain = null;
let analyser = null;
let audioReady = false;
let muted = false;
let previousVolume = 70;
let animationId = null;
let currentObjectURL = null;

for (let i = 0; i < 45; i++) {
  const bar = document.createElement("span");
  visualizer.appendChild(bar);
}

function initializeAudio() {
  if (audioReady) return true;
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      alert("Your browser does not support Web Audio API.");
      return false;
    }

    audioContext = new AudioContextClass();
    source = audioContext.createMediaElementSource(audio);

    masterGain = audioContext.createGain();

    bassFilter = audioContext.createBiquadFilter();
    bassFilter.type = "lowshelf";
    bassFilter.frequency.value = 200;

    midFilter = audioContext.createBiquadFilter();
    midFilter.type = "peaking";
    midFilter.frequency.value = 1000;
    midFilter.Q.value = 1;

    trebleFilter = audioContext.createBiquadFilter();
    trebleFilter.type = "highshelf";
    trebleFilter.frequency.value = 4000;

    bassBoostGain = audioContext.createGain();
    bassBoostGain.gain.value = 0;

    delayNode = audioContext.createDelay(2);
    delayNode.delayTime.value = 0.3;

    echoGain = audioContext.createGain();
    echoGain.gain.value = 0;

    analyser = audioContext.createAnalyser();
    analyser.fftSize = 128;
    analyser.smoothingTimeConstant = 0.8;

    source.connect(bassFilter);
    bassFilter.connect(midFilter);
    midFilter.connect(trebleFilter);
    trebleFilter.connect(bassBoostGain);
    bassBoostGain.connect(masterGain);

    masterGain.connect(analyser);
    analyser.connect(audioContext.destination);

    masterGain.connect(delayNode);
    delayNode.connect(echoGain);
    echoGain.connect(audioContext.destination);

    audioReady = true;
    updateVolume();
    updateEqualizer();
    updateEffects();
    return true;
  } catch (error) {
    console.error("Audio initialization failed:", error);
    alert("Unable to initialize audio. Please try a modern browser.");
    return false;
  }
}

function updateVolume() {
  const value = Number(volumeSlider.value);
  volumeValue.textContent = value;
  if (masterGain && audioContext) {
    masterGain.gain.setTargetAtTime(
      muted ? 0 : value / 100,
      audioContext.currentTime,
      0.03
    );
  }
  $("muteBtn").textContent = muted ? "UNMUTE" : "MUTE";
}

volumeSlider.addEventListener("input", () => {
  if (Number(volumeSlider.value) > 0) {
    previousVolume = Number(volumeSlider.value);
    muted = false;
  }
  updateVolume();
});

$("volumeUp").addEventListener("click", () => {
  muted = false;
  volumeSlider.value = Math.min(100, Number(volumeSlider.value) + 5);
  previousVolume = Number(volumeSlider.value);
  updateVolume();
});

$("volumeDown").addEventListener("click", () => {
  muted = false;
  volumeSlider.value = Math.max(0, Number(volumeSlider.value) - 5);
  previousVolume = Number(volumeSlider.value);
  updateVolume();
});

$("maxVolume").addEventListener("click", () => {
  muted = false;
  volumeSlider.value = 100;
  previousVolume = 100;
  updateVolume();
});

$("muteBtn").addEventListener("click", () => {
  if (!muted) {
    previousVolume = Number(volumeSlider.value);
    muted = true;
  } else {
    muted = false;
    volumeSlider.value = previousVolume || 70;
  }
  updateVolume();
});

musicFile.addEventListener("change", () => {
  const file = musicFile.files[0];
  if (!file) return;

  if (!file.type.startsWith("audio/")) {
    alert("Please select a valid audio file.");
    musicFile.value = "";
    return;
  }

  if (currentObjectURL) URL.revokeObjectURL(currentObjectURL);
  currentObjectURL = URL.createObjectURL(file);

  audio.src = currentObjectURL;
  audio.load();
  $("trackName").textContent = file.name;
  $("trackArtist").textContent = "LOCAL AUDIO FILE";
  $("playerStatus").textContent = "TRACK LOADED";
  playBtn.textContent = "▶";
});

playBtn.addEventListener("click", async () => {
  if (!audio.src) {
    alert("Please select a music file first.");
    return;
  }

  if (!initializeAudio()) return;

  try {
    if (audioContext.state === "suspended") await audioContext.resume();
    if (audio.paused) await audio.play();
    else audio.pause();
  } catch (error) {
    console.error(error);
    $("playerStatus").textContent = "PLAYBACK ERROR";
  }
});

audio.addEventListener("play", () => {
  playBtn.textContent = "Ⅱ";
  $("playerStatus").textContent = "NOW PLAYING";
  startVisualizer();
});

audio.addEventListener("pause", () => {
  playBtn.textContent = "▶";
  stopVisualizer();
  $("playerStatus").textContent = "PAUSED";
});

audio.addEventListener("ended", () => {
  playBtn.textContent = "▶";
  $("playerStatus").textContent = "PLAYBACK FINISHED";
});

audio.addEventListener("error", () => {
  $("playerStatus").textContent = "UNABLE TO PLAY FILE";
});

$("stopBtn").addEventListener("click", () => {
  audio.pause();
  audio.currentTime = 0;
  playBtn.textContent = "▶";
  $("playerStatus").textContent = "STOPPED";
});

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

audio.addEventListener("loadedmetadata", () => {
  $("duration").textContent = formatTime(audio.duration);
});

audio.addEventListener("timeupdate", () => {
  $("currentTime").textContent = formatTime(audio.currentTime);
  if (Number.isFinite(audio.duration) && audio.duration > 0) {
    $("seekSlider").value = (audio.currentTime / audio.duration) * 1000;
  }
});

$("seekSlider").addEventListener("input", () => {
  if (Number.isFinite(audio.duration) && audio.duration > 0) {
    audio.currentTime = (Number($("seekSlider").value) / 1000) * audio.duration;
  }
});

function updateEqualizer() {
  $("bassValue").textContent = $("bassSlider").value + " dB";
  $("midValue").textContent = $("midSlider").value + " dB";
  $("trebleValue").textContent = $("trebleSlider").value + " dB";

  if (!audioReady) return;
  bassFilter.gain.setTargetAtTime(Number($("bassSlider").value), audioContext.currentTime, 0.05);
  midFilter.gain.setTargetAtTime(Number($("midSlider").value), audioContext.currentTime, 0.05);
  trebleFilter.gain.setTargetAtTime(Number($("trebleSlider").value), audioContext.currentTime, 0.05);
}

["bassSlider", "midSlider", "trebleSlider"].forEach(id => {
  $(id).addEventListener("input", () => {
    if (!audioReady && !initializeAudio()) return;
    updateEqualizer();
  });
});

const presets = {
  normal: [0, 0, 0],
  bass: [10, 2, -1],
  pop: [-1, 3, 5],
  rock: [5, 1, 6]
};

document.querySelectorAll(".preset").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".preset").forEach(btn => btn.classList.remove("active"));
    button.classList.add("active");
    const values = presets[button.dataset.preset];
    $("bassSlider").value = values[0];
    $("midSlider").value = values[1];
    $("trebleSlider").value = values[2];
    if (!audioReady && !initializeAudio()) return;
    updateEqualizer();
  });
});

function updateEffects() {
  if (!audioReady) return;
  bassBoostGain.gain.setTargetAtTime(
    $("bassBoost").checked ? 8 : 0,
    audioContext.currentTime,
    0.1
  );
  echoGain.gain.setTargetAtTime(
    $("echoEffect").checked ? 0.35 : 0,
    audioContext.currentTime,
    0.1
  );
}

["bassBoost", "echoEffect"].forEach(id => {
  $(id).addEventListener("change", () => {
    if (!audioReady && !initializeAudio()) return;
    updateEffects();
  });
});

$("rgbEffect").addEventListener("change", event => {
  document.body.classList.toggle("party-mode", event.target.checked);
  document.documentElement.style.setProperty("--purple", event.target.checked ? "#ff00cc" : "#a855f7");
  document.documentElement.style.setProperty("--cyan", event.target.checked ? "#00ffff" : "#22d3ee");
});

$("visualizerEffect").addEventListener("change", event => {
  if (event.target.checked && !audio.paused) startVisualizer();
  else stopVisualizer();
});

function startVisualizer() {
  if (!audioReady || !analyser || !$("visualizerEffect").checked) return;
  stopVisualizer();

  const bars = visualizer.querySelectorAll("span");
  const data = new Uint8Array(analyser.frequencyBinCount);

  function draw() {
    if (audio.paused || !$("visualizerEffect").checked) {
      stopVisualizer();
      return;
    }
    animationId = requestAnimationFrame(draw);
    analyser.getByteFrequencyData(data);
    bars.forEach((bar, index) => {
      const value = data[Math.floor(index * data.length / bars.length)] || 0;
      bar.style.height = Math.max(5, value * 0.8) + "px";
    });
  }
  draw();
}

function stopVisualizer() {
  if (animationId !== null) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
  visualizer.querySelectorAll("span").forEach(bar => bar.style.height = "8px");
}

$("connectBtn").addEventListener("click", () => {
  alert(
    "BLUETOOTH SPEAKER CONNECTION\n\n" +
    "1. Turn on your Bluetooth speaker.\n" +
    "2. Open your device Bluetooth settings.\n" +
    "3. Pair your speaker.\n" +
    "4. Select your speaker as the audio output.\n" +
    "5. Return here and play music.\n\n" +
    "This website plays audio through your device's selected output."
  );
});

updateVolume();
updateEqualizer();
console.log("PARTY Speaker Controller ready.");
