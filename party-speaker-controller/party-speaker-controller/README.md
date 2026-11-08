# PARTY Speaker Controller

A responsive DJ-style speaker controller website built with HTML, CSS and JavaScript.

## Run in GitHub Codespaces

1. Open this repository in GitHub Codespaces.
2. Open the terminal.
3. Run:

```bash
python3 -m http.server 8000
```

4. Open the **Ports** tab.
5. Open forwarded port `8000` in your browser.

## Features

- Local audio file upload
- Play, pause and stop
- Seek bar and playback time
- Website audio volume and mute
- Bass, mid and treble equalizer
- Normal, Bass, Pop and Rock presets
- Extra bass and echo effects
- RGB-style website party mode
- Live audio frequency visualizer
- Responsive mobile layout

## Bluetooth notes

Pair your Bluetooth speaker in your operating system's Bluetooth settings and choose it as the system audio output. The website plays its audio through the selected output.

A standard browser website cannot universally control a Bluetooth speaker's hardware volume, physical RGB lights, or proprietary speaker features. The volume slider controls audio played by this website only.

## Browser

Use a modern browser such as Chrome or Edge. Audio processing uses the Web Audio API and starts after a user interaction.
