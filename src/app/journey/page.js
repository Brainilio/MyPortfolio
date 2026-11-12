import Link from "next/link";
import Heading from "../heading";
import { EXPERIMENTS } from "./experiments";
import "./lab-grid.css";

export const metadata = { title: "Lab" };

// The lab's front page: a grid of everything in it. Each card opens the experiment on its own page.
export default function LabPage() {
  return (
    <div className="lab-index">
      <div className="lab-index-top" aria-hidden="true" />
      <main id="main">
        <Heading size="display">Lab</Heading>
        <p className="lab-index-intro">Small experiments: 3D scenes, interface details and animation tricks.</p>
        <ul className="lab-grid">
          {EXPERIMENTS.map(experiment => (
            <li key={experiment.slug}>
              <Link href={`/journey/${experiment.slug}/`} className="lab-card">
                <span className="lab-card-media"><img src={experiment.thumb} alt="" width="800" height="500" loading="lazy" /></span>
                <span className="lab-card-text">
                  <span className="lab-card-title">{experiment.title}</span>
                  <span className="lab-card-kind">{experiment.kind}</span>
                </span>
                <span className="lab-card-note">{experiment.note}</span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
