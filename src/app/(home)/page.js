import Home from "./home";
import { getHomepageCopy } from "../../lib/prismic";

export default async function HomePage() {
  return <Home copy={await getHomepageCopy()} />;
}
