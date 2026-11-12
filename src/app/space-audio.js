"use client";
import { useEffect, useRef, useState } from "react";

// Background music with one global toggle. Browsers only allow audio after a user gesture, so playback
// starts on the first click/tap/key once sound is on; the choice is remembered. Web Audio gain nodes do
// the fades (iOS ignores <audio>.volume). The control hides itself if the track is missing.
// Looping: two players take turns, crossfading over the last XFADE seconds, because <audio loop> leaves
// an audible gap at the seam of a compressed file (and decoding the whole track would cost ~60 MB).
const KEY = "journey-sound", LEVEL = 0.45, FADE = 1.6, XFADE = 3;

export default function SpaceAudio({ src }) {
  const decks = [useRef(null), useRef(null)], control = useRef(null);
  const [on, setOn] = useState(true), [playing, setPlaying] = useState(false), [missing, setMissing] = useState(false);

  useEffect(() => {
    let wanted = true, graph = null, active = 0, timer = 0, poll = 0;
    try { if (localStorage.getItem(KEY) === "off") { wanted = false; setOn(false); } } catch {}
    const players = decks.map(deck => deck.current);
    const ramp = (param, to, seconds) => {
      const now = graph.ctx.currentTime;
      param.cancelScheduledValues(now); param.setValueAtTime(param.value, now); param.linearRampToValueAtTime(to, now + seconds);
    };
    const build = () => {
      const Context = window.AudioContext || window.webkitAudioContext;
      if (!Context) return false;
      const ctx = new Context(), master = ctx.createGain();
      master.gain.value = 0; master.connect(ctx.destination);
      const gains = players.map((player, i) => {
        const gain = ctx.createGain(); gain.gain.value = i === 0 ? 1 : 0;
        ctx.createMediaElementSource(player).connect(gain).connect(master);
        return gain;
      });
      graph = { ctx, master, gains };
      return true;
    };
    // Near the end of the playing deck, start the other one from the top and crossfade into it.
    const watch = () => {
      const current = players[active];
      if (!current.duration || current.paused || current.currentTime < current.duration - XFADE) return;
      const next = 1 - active;
      players[next].currentTime = 0;
      players[next].play().catch(() => {});
      ramp(graph.gains[next].gain, 1, XFADE); ramp(graph.gains[active].gain, 0, XFADE);
      const done = active; setTimeout(() => players[done].pause(), XFADE * 1000 + 100);
      active = next;
    };
    const start = () => {
      if (!wanted || document.hidden) return;
      if (!graph && !build()) return;
      graph.ctx.resume();
      clearTimeout(timer);
      players[active].play().then(() => { setPlaying(true); ramp(graph.master.gain, LEVEL, FADE); }).catch(() => {});
      clearInterval(poll); poll = setInterval(watch, 250);
    };
    const stop = () => {
      setPlaying(false); clearInterval(poll);
      if (!graph) return;
      ramp(graph.master.gain, 0, FADE);
      clearTimeout(timer); timer = setTimeout(() => players.forEach(player => player.pause()), FADE * 1000);
    };
    // Any first interaction starts it, except a click on the toggle itself (that one decides on its own).
    const gesture = event => { if (!event.target.closest?.(".sound-toggle") && wanted && players[active].paused) start(); };
    const visibility = () => { if (document.hidden) stop(); else if (wanted && graph) start(); };
    const fail = () => setMissing(true);
    players[0].addEventListener("error", fail);
    window.addEventListener("pointerdown", gesture);
    window.addEventListener("keydown", gesture);
    document.addEventListener("visibilitychange", visibility);
    control.current = next => { wanted = next; try { localStorage.setItem(KEY, next ? "on" : "off"); } catch {} next ? start() : stop(); };
    return () => {
      players[0].removeEventListener("error", fail);
      window.removeEventListener("pointerdown", gesture);
      window.removeEventListener("keydown", gesture);
      document.removeEventListener("visibilitychange", visibility);
      clearTimeout(timer); clearInterval(poll); players.forEach(player => player.pause()); graph?.ctx.close();
    };
  }, []);

  const toggle = () => { const next = !on; setOn(next); control.current?.(next); };
  return (
    <>
      <audio ref={decks[0]} src={src} preload="none" />
      <audio ref={decks[1]} src={src} preload="none" />
      {!missing && (
        <button type="button" className="sound-toggle" aria-pressed={on} onClick={toggle}>
          <span className="sound-bars" data-playing={playing && on} aria-hidden="true"><i /><i /><i /><i /></span>
          Sound {on ? "on" : "off"}
        </button>
      )}
    </>
  );
}
