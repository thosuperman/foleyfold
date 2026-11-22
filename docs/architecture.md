# Architecture and decisions

```text
local File → local object URL ───────────┐
bundled original MP4 ──────────────────┴→ HTML media clock → caption overlay
                                            ↕
human listening note + time range → cue sheet → human approval → WebVTT download
             │                         ↕
             │                  browser localStorage (per reel)
             ↓
  request policy → App Check + Firebase AI Logic → suggested caption + SDK source
                     ├─ device only (default; require usable local capability)
                     └─ local preferred, cloud fallback (online + per-request consent)
```

- **Small static application:** TypeScript, Vite, web platform media APIs; no account system, audio upload, database, analytics or backend needed for the editorial work. Presentation is separate from cue validation, export, GPU-independent film playback and the SDK adapter.
- **Trust boundary:** text to the model consists of the author's note and duration, not filename, frames, audio, other cues, or project metadata. Model output is plain text, bounded, rendered via textContent, inserted only on explicit acceptance and never auto-approved. App Check protects provider calls; it is not a guarantee that all client data is private.
- **Timeline is not an AI detector:** the sample waveform is derived from the original synthesized PCM, not decorative noise. Local imports show cue timing, not a made-up waveform. Non-overlap and minimum 100 ms cues keep review/playback unambiguous. Frame-based updates show captions while media plays.
- **Storage tradeoff:** metadata only; never persist media bytes. Fingerprint every file by hashing successive 4 MiB chunks and then the chunk digests. Restore validated cues on re-open, never another film based only on name. A stale writer is warned and offered a full local JSON backup rather than overwriting notes. Browser storage is plaintext, same-origin and not encrypted; do not use shared profiles for sensitive work.
- **Small, reproducible demo:** the included 18-second animated rail film and synthesized foley were created for this project. Rebuild with Python (NumPy, SciPy, Pillow) and FFmpeg using `python scripts/render-sample.py`. PNGs/MP4/WebVTT are local deliverables, not third-party content.
- Deliberate omissions: no speech transcription, automatic sound identification, public sharing, production multi-user synchronization or native mobile model. The machine suggests wording; the editor owns the timing, meaning and release.
