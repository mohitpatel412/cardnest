import { runFetchAdapter } from "./fetch-adapter.mjs";

export function getIssuerAdapter(issuer) {
  if (issuer.strategy === "fetch") {
    return {
      acquire: (context) => runFetchAdapter({ issuer, ...context }),
    };
  }

  throw new Error(`Unsupported issuer strategy: ${issuer.strategy}`);
}
