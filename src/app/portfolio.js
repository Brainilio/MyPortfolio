"use client";
import { useEffect, useState } from "react";
import LaunchHero from "./launch-hero";
import StoryChapters from "./story-chapters";
import dynamic from "next/dynamic";
const SpaceStory = dynamic(() => import("./space-story"), { ssr: false });
import { useReducedMotion } from "motion/react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

export default function Portfolio() {
  const [ending, setEnding] = useState(0);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) return;
    const lenis = new Lenis({
      autoRaf: true,
      lerp: 0.075,
      smoothWheel: true,
      anchors: true,
    });
    return () => lenis.destroy();
  }, [reduced]);
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <SpaceStory ending={ending} />
      <LaunchHero />
      <StoryChapters ending={ending} onEnding={() => setEnding(value => value + 1)} />
    </>
  );
}
