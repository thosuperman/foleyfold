# Foleyfold
**Give the sounds between the words a caption.**

## Inspiration
A train crosses a valley. Nobody speaks. A dialogue transcript can be empty, but the bell, the rhythm of wheels and the departing horn tell a story. The [W3C guidance on captions](https://www.w3.org/WAI/media/av/captions/) calls for meaningful non-speech audio as well as speech. For an independent editor with an unreleased cut, there is another question: why should finding the right words require uploading the film?

## What it does
Foleyfold is a private cutting room for sound captions. Play an original short or open a local clip. Spot a sound on the timeline, describe what you heard, and write a caption in the inspector. If Firebase is connected, you can ask for a draft from that note. Review the wording against the picture, approve it, then export the approved cues as a timed WebVTT track. Unreviewed drafts never slip into the deliverable.

The supplied rail film is an original animation with a synthesized soundtrack. Its first caption and cue notes are hand-authored examples, not generated responses. The fully manual workflow is usable without credentials. No speech transcription, automated identification of sounds, or upload of footage is implied.

## How we built it
TypeScript, Vite and native browser media APIs keep timing, text editing and export separate from model availability. Local files become object URLs; notes live in this browser. Firebase AI Logic handles single-turn generation via the Chrome device model (the contest targets Gemini Nano 4) or Gemini Developer API. The cloud model is explicitly `gemini-3.5-flash-lite`. App Check uses reCAPTCHA Enterprise when configured.

For a private draft the adapter checks capability before initializing the local model and calls `ONLY_ON_DEVICE`. Only a connected editor who explicitly opts in for that note can use `PREFER_ON_DEVICE` with fallback. The prompt contains the listening note and cue length, never the film. A result's label comes from SDK provenance, not a guessed route. The [readiness report](readiness.md) separates SDK integration from routes actually validated on hardware.

## Challenges we ran into
A nearly invisible boundary mattered more than a fancy prompt: on a browser without a device adapter, a mode name alone wasn't sufficient to establish our privacy contract. We made device-only requests fail before entering the SDK if capability is missing or indeterminate. Another surprise was timing: browser media time updates can be farther apart than a short cue, so captions now follow the playback frame loop. On re-open, same-named files must not inherit one another's private notes; content fingerprints separate their cue sheets.

## Accomplishments we're proud of
The studio produces an actual interoperable artifact, not a chat transcript. A filmmaker can edit a complete non-speech caption track without an account or media upload. The original short makes the problem audible in seconds. When inference cannot run, the interface says so and the editing work survives.

## What we learned
A sound caption is an editorial decision. A model can suggest a phrase for an observation; it cannot tell us whether the distant bell matters to the scene. Putting human approval between generation and export made the product more useful, not less. Privacy also needs per-request decisions and testable failure states rather than a general “local-first” slogan.

## What's next
Work with Deaf and hard-of-hearing reviewers and independent editors to evaluate the descriptions, then test Nano on multiple supported Chrome devices. Priorities after validation are reader-paced caption checks and additional interoperable timecode formats. We have not conducted a user study or established accessibility outcomes.

## Built with
TypeScript, Vite, Firebase AI Logic, Firebase App Check, Gemini Developer API, Chrome Prompt API via the SDK, HTMLMediaElement, Canvas, Web Crypto, WebVTT, GitHub Actions, Python, Pillow, NumPy, SciPy and FFmpeg.

## Disclosure and rights
New application, source illustration, sample animation and foley created during the contest window with AI-assisted development. Uses third-party SDKs and development tools listed in the lockfile and above. Source and original assets are Apache-2.0. The entrant must confirm authorship, participation and eligibility before submitting. No account submission or YouTube upload has been performed.
