# Director’s script / reproducible demo

**Release cut:** [demo.mp4](demo.mp4), 1:19, English narration and open captions, 1600×900 H.264/AAC. [English SRT](subtitles.srt), [voiceover](voiceover.md), [thumbnail](thumbnail.png), [shot timings](storyboard.md), [YouTube metadata](youtube-title-description.md). Actual Chrome footage from the [source capture](../media/studio-capture.webm), not a scripted mock interface.

**Editorial arc:** Hear the bell before the name of the product. Show why a silence in a transcript isn't a silence in the film. Spot the bell, describe it, show the real availability panel, then explain the implemented hybrid routes on an explicitly labeled technical card. Return to the actual film, write and approve a caption by hand, replay it, and download the WebVTT. Let the bell play without a narrator talking over it.

**Evidence boundary:** At capture time the local model was unavailable in the recording profile and Firebase was not connected. No AI output appears. The route diagram explains code, not a test result. Do not claim device/cloud success, or that the sample cue/voiceover was produced by Firebase. A clean system recording of local import used the browser automation file chooser; the operating system picker itself is not being demonstrated.

## Reproduce this cut
On Ubuntu install FFmpeg with libx264, AAC and the flite filter, DejaVu fonts and Python 3 with Pillow. From the repo root, run:
```sh
python scripts/render-demo.py
ffprobe -v error -show_entries format=duration:stream=codec_name,width,height submission/video/demo.mp4
ffmpeg -v error -xerror -i submission/video/demo.mp4 -f null -
```
The renderer crops browser chrome, sequences actual recorded interactions and two labeled editorial cards, preserves the recorded playback audio for the in-context shot, synthesizes the English guide locally and regenerates the SRT, shot list and thumbnail. It does not generate footage of model responses.

## Capture the live hybrid replacement when available
1. Complete [setup](../../docs/setup.md) on the actual judging origin. Use a supported desktop Chrome device. Prepare an original non-sensitive local clip; do not record account pages, other tabs, tokens, private filenames or notifications. Record system audio and the application window only.
2. Start with the sample and a clean test profile. Record **Draft with AI** and the exact note. With fallback **off**, request an on-device draft. Show the actual SDK source and response. Replay with the model installed and the loaded editor disconnected. If it cannot run, keep the unavailable disclosure; do not substitute sample text.
3. On a browser with no usable device model, stay online. Explicitly enable fallback, generate, show the actual **Cloud** source and reset consent. Demonstrate approval before export. A cloud model named in the UI or a network toggle alone proves nothing.
4. Replace the capability/diagram portion only with successful real footage and re-time narration, open captions and SRT. Keep the final cut under three minutes. Revise YouTube description, gallery and readiness evidence with device, Chrome version and SDK source.
5. Owner: review the MP4 and its English subtitles, upload publicly on [YouTube Studio](https://studio.youtube.com/), use the supplied title, description and thumbnail, then paste the real watch URL into the fields. No upload or Devpost submission has been performed.
