import path from "node:path";
import { getIssuerAdapter } from "./adapters/index.mjs";
import { ISSUER_CATALOG, filterIssuersByEnv } from "./config/issuers.mjs";
import { createRawSourceStore } from "./lib/fs-store.mjs";

export async function runAcquisition() {
  const rootDir = process.cwd();
  const issuers = filterIssuersByEnv(ISSUER_CATALOG, process.env.SCRAPE_ONLY);

  if (!issuers.length) {
    throw new Error("No issuers selected for acquisition");
  }

  const store = await createRawSourceStore({ rootDir, issuers });

  for (const issuer of issuers) {
    const adapter = getIssuerAdapter(issuer);
    console.log(`Acquiring ${issuer.issuerName} via ${issuer.strategy}`);
    await adapter.acquire({ rootDir, store });
  }

  const manifestRelative = path.relative(rootDir, store.manifestPath).replace(/\\/g, "/");
  console.log(`Saved acquisition manifest to ${manifestRelative}`);
}

runAcquisition().catch((error) => {
  console.error(error);
  process.exit(1);
});
