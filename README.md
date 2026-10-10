# Nexcod POS: documentation and ad campaign

Material made from the live Nexcod POS software (v3.0.0, demo store "Sharma Medical Store") on 10 October 2026.

## What is here

| Folder | Contents |
| --- | --- |
| `documentation/` | Screen-by-screen user manual. Open `index.html` in a browser, or share `Nexcod-POS-User-Manual.pdf` (95 pages). Screenshots are in `documentation/img/`; customer phone numbers, e-mails and IP addresses are blurred. |
| `ad-videos/` | 15 vertical ad videos (1080×1920, Hindi voiceover), one per day, in `ad-videos/videos/`. `index.html` shows them with ready-to-copy captions; `captions.md` has the same captions and the voiceover scripts. |
| `ad-videos/source/` | Everything needed to edit and re-render the videos: scene scripts (`campaign.py`), the animation template, the renderer and the audio mixer. |
| `seo/` | Researched SEO and founder-brand plan (`index.html`), ready-to-paste JSON-LD (`jsonld/`), suggested meta tags (`meta-tags.csv`) and a 24-piece content calendar (`content-calendar.csv`). |

## Re-rendering a video

Requirements: Python 3, Node 18+, ffmpeg, Playwright with Chromium, and `edge-tts` (`pip install edge-tts`).

```bash
cd ad-videos/source
python3 campaign.py            # writes campaign.json from the scene scripts
python3 tts.py                 # Hindi voiceover per scene + timings (build/timeline.json)
python3 music.py               # background music bed (original, royalty-free)
node render.js video 03        # renders build/silent_03.mp4 (omit the id for all videos)
python3 mix.py 03              # adds voice + music -> final/day-03-....mp4
```

To change the words on screen or the voiceover, edit the scene lines in `campaign.py` and run the steps again. Screenshots used in the videos are in `source/shots/`.
