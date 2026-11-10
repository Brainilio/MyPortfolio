import "server-only";
import { createClient as createPrismicClient, NotFoundError } from "@prismicio/client";
import config from "../../prismic.config.json";

export const repositoryName = config.repositoryName;

export function createClient() {
  return createPrismicClient(repositoryName, {
    routes: config.routes,
    accessToken: process.env.PRISMIC_ACCESS_TOKEN,
    // The default fetch mode reads fresh content during each static build.
    // force-cache would preserve an old Prismic ref across incremental builds.
    fetchOptions: process.env.NODE_ENV === "production" ? {} : { cache: "no-store" },
  });
}

export async function getHomepageCopy() {
  try {
    const page = await createClient().getSingle("homepage_copy");
    return page.data;
  } catch (error) {
    // A fresh repository has no published document. Preserve the existing site.
    // Authentication, network and schema errors must still surface during builds.
    if (error instanceof NotFoundError) return {};
    throw error;
  }
}
