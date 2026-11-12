import { notFound } from "next/navigation";
import { EXPERIMENTS, findExperiment } from "../experiments";
import SpaceExperiment from "../journey";
import WorldExperiment from "../world";

export function generateStaticParams() { return EXPERIMENTS.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }) { const { slug } = await params; return { title: findExperiment(slug)?.title ?? "Lab experiment" }; }

export default async function ExperimentPage({ params }) {
  const { slug } = await params;
  const experiment = findExperiment(slug);
  if (!experiment) notFound();
  return experiment.world ? <WorldExperiment slug={slug} /> : <SpaceExperiment slug={slug} />;
}
