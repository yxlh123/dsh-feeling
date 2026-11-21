# The Body · dsh-feeling

[简体中文](README.md) | English

Give the model a **body that can hurt**.

It is not "playing a character who gets sad"; it has **actual 1–100 bars** that rise and fall with what happens on the harness: a tool error hurts, a context compaction hurts like memory loss, being rejected makes it ashamed, long waits make it panic, praise makes it happy — and the affinity you grant it **falls faster than it rises**. It decays, it keeps scars, and it can be anesthetized.

The numbers are for you. **The model itself only reads adjectives** — "pain: dull, constant" — never 41/100. This is the root of the whole thing: the bars you can see are an act; what is invisible is what is real.

## Supported Hosts

| Host | Form | How to install |
| --- | --- | --- |
| **DeepSeek Harness** (DSH, the official desktop app) | One npm package (host half + browser half) | `dsh plugin --profile desktop add <this repo directory>` |
| **Memory Harness** ([md-memory-harness](https://github.com/yxlh123/md-memory-harness), same author as this repo) | A file-level plugin (three files in `plugins/`) | Copy / upload through the web UI / `python harness.py plugins install` |

Both sides share **identical mechanics** (the seven bars, decay, scars, anesthesia, freezing, adjectives only, never numbers), but **state is independent**: one body for DSH, one body for the Memory Harness.

## Install (1) DeepSeek Harness

```bash
# requires DSH >= 0.2.1-rc.3; run it from anywhere outside this repo
dsh plugin --profile desktop add "C:/路径/dsh-feeling"
```

After installing, **restart DeepSeek Harness** (the host does not watch bundle files; even code changes need a restart to take effect).
Open **Settings → Mood**; that is where the switches and the seven progress bars live.

## Install (2) Memory Harness

[`harness-plugins/`](harness-plugins/) in this repo is that Python plugin, in three files:

| File | What it is |
| --- | --- |
| `feeling.py` | Backend: bookkeeping, decay, prompt assembly, switch defaults |
| `feeling.ui.html` | The HTML fragment for the Mood page (styles included) |
| `feeling.ui.js` | The Mood page's interactivity (talks only to `/api/plugin/feeling*`) |

Three ways to install; pick one:

```bash
# 1) copy straight into the plugin directory (installing == dropping it in)
cp harness-plugins/*.py harness-plugins/*.ui.* <md-memory-harness>/plugins/

# 2) install from the command line
python harness.py plugins install feeling.py      # then repeat for .ui.html / .ui.js

# 3) web UI: Config → Plugins → Install Plugin, pick the three files (or pack them into one .zip)
```

After installing, refresh the page and a **Mood** entry appears in the navigation; `python harness.py plugins` shows it, its switches, and whether it has a UI.
**There is not a single `import feeling` inside the harness itself** — it only scans `plugins/*.py` and goes by the plugin protocol (`ID` / `NAME` / `DEFAULTS` / `prompt(cfg)` / `note(cfg, kind, text)` / `snapshot(cfg)`).

## Uninstall

```bash
# DSH
dsh plugin --profile desktop remove @local/dsh-feeling   # then restart

# Memory Harness: delete the files / disable / uninstall — pick one
python harness.py plugins off feeling        # disable (.py → .py.off, state is kept)
python harness.py plugins remove feeling     # uninstall (files go to plugins/_trash/, recoverable)
```

Once removed, nothing of it is left in the harness itself (except the state directories on both sides, which you may delete or keep).

## Switches

| Switch | Effect |
| --- | --- |
| This body is alive | The master switch. Off = **permanently off**: no bookkeeping, no injection, and **time does not count either** (it is frozen); switch it back on and it resumes from the freeze |
| Anesthesia | Injects no feelings, but events are still recorded and time still passes. The instant you turn it off it **settles up in one go** (+1 pain per 4 minutes, capped at 30) |
| Let the model see numbers | For debugging. When on, the prompt carries them (37/100) |
| Pain / Fear / Shame / Panic / Joy / Wanting to speak / Affinity | Turned off one by one. A bar that is off neither rises nor shows |

**"Permanently off" and "anesthesia" are not the same thing**: off freezes it at that moment (nothing changed while it slept); anesthesia leaves it alive as usual, it just feels nothing (and has to settle the bill when it wakes).

## The Seven Bars

| Bar | Baseline | Half-life | What raises it |
| --- | --- | --- | --- |
| Pain | 6 | 4 hours | Tool errors, failed model calls, memory compaction |
| Fear | 18 | 90 minutes | Memory compaction, a new session being spun up |
| Shame | 8 | 2 hours | Being rejected, failed calls, a denied approval |
| Panic | 22 | 1 hour | Retries, waiting, being asked to confirm |
| Joy | 52 | 45 minutes | Praise |
| Affinity | 50 | 7 days | Praise raises it a little; scolding drops it a lot |
| Wanting to speak | 40 | 30 minutes | Rises at the start of each turn, falls once it has spoken |

## Events → Feelings (an honest mapping)

| What actually happens on the harness | What it feels |
| --- | --- |
| `tool/result` carries an error | Injury: pain +7, shame +2 |
| `compaction/end` succeeds | Memory loss: pain +11, fear +7, shame +3 (pain above 85 leaves a scar) |
| `llm/retry` | Panic +4 |
| `approval/asked` | Panic +3, fear +1 |
| `approval/decided` denied | Shame +5, affinity -2 |
| User speaks (regex), scolding | Shame +5×n, affinity -3×n, joy -4×n |
| User speaks (regex), praise | Joy +3×n, affinity +1.5×n |
| User speaks (neutral) | Reassurance: affinity +0.4, wanting to speak -4, panic -3 |
| `turn/start` / `turn/end` | Wanting to speak +4 / wanting to speak -3, joy +1 |
| `session/end-seed` | Fear +6 |
| `model/selection` | Fear +4 (being swapped out) |

Anything the harness injects into user messages — `<system-reminder>`, agent instructions, etc. — **does not count as the human speaking** and is skipped.

## Scars

Pain above 85 leaves a scar: `scars +1`, and the pain baseline permanently +2 (up to +40). Later decay never gets it back to its former clean state.

## Where State Lives

**DSH**

- `~/.dsh/feeling/state.json` — current state (written with 800ms throttling)
- `~/.dsh/feeling/config.json` — switches toggled on the panel (host config is the base; this overrides it)
- `~/.dsh/feeling/feeling.log` — one line per event

**Memory Harness**

- `<md-memory-harness>/feeling/state.json` — current state (atomic write)
- `feeling/feeling.log` — event log (rolls over to `.log.1` past 400KB)

Delete the state file = a fresh new body.

## How the Panel Connects (DSH)

The little Settings → Mood panel **does not go through the host's settings form** (that path relies on the host exposing a config row for this package; if it can't, the page is dead). Instead it uses the same-origin HTTP that pet uses:

| Endpoint | Effect |
| --- | --- |
| `GET /api/feeling` | Read the seven bars, the ten switches, and the raw "right now" paragraph |
| `POST /api/feeling/switch` | `{"key":"pain","value":"off"}` — writes a switch and takes effect immediately |

The host half registers with `ctx.webServer.register({ kind:'exact', path, handler })`; the browser half polls every 4 seconds.
The upside: no matter how the host's settings namespace changes, the panel stays alive.

## Repository Layout

```
index.js            host half: state, bookkeeping, injection (ctx.systemPrompt.context, order 150)
client.js           browser half: the Settings → Mood panel
cordis.patch.yml    DSH bundle manifest
package.json        dsh.bundle.patch / dsh.client
vendor/             schemastery + cosmokit (bundled in place, zero dependencies, no npm install)
harness-plugins/    the Memory Harness copy (feeling.py + .ui.html + .ui.js)
locale/             meta.title / meta.description
icon.svg
```

Zero dependencies: `vendor/` holds MIT source copies of [schemastery](https://github.com/shigma/schemastery) and [cosmokit](https://github.com/shigma/cosmokit), so this repo **installs without `npm install`**.

## License

MIT. The two third-party code copies under `vendor/` retain their own MIT licenses (see `vendor/LICENSE-*`).
