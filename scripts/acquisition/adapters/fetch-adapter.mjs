import { collectPageDiscoveries } from "../lib/discovery.mjs";
import { fetchArtifact } from "../lib/http-client.mjs";
import { createRawSourceRecord } from "../lib/record.mjs";
import { isLikelyHtml, isLikelyJson, mapWithConcurrency, normalizeText, uniqueBy } from "../lib/utils.mjs";

async function fetchAndStoreSource({
  store,
  issuer,
  sourceType,
  url,
  parentSourceId = null,
  discoveredFromUrl = null,
  linkText = "",
  allowDiscovery = false,
}) {
  const artifact = await fetchArtifact(url);
  const blobPath = await store.persistBlob(artifact.buffer, artifact.checksumSha256, artifact.extension);
  const discoveries = allowDiscovery && isLikelyHtml(artifact.contentType, artifact.finalUrl)
    ? collectPageDiscoveries(artifact.text || "", artifact.finalUrl, issuer)
    : { title: "", detailLinks: [], pdfLinks: [], supplementalHtmlLinks: [], apiEndpoints: [] };

  const record = createRawSourceRecord({
    store,
    issuer,
    sourceType,
    parentSourceId,
    discoveredFromUrl,
    url,
    finalUrl: artifact.finalUrl,
    linkText,
    status: artifact.status,
    ok: artifact.ok,
    contentType: artifact.contentType,
    contentLength: artifact.contentLength,
    checksumSha256: artifact.checksumSha256,
    blobPath,
    metadata: {
      responseHeaders: artifact.headers,
      title: discoveries.title,
      linkText: normalizeText(linkText),
      discoveredPdfLinks: discoveries.pdfLinks,
      discoveredHtmlLinks: discoveries.supplementalHtmlLinks,
      discoveredApiEndpoints: discoveries.apiEndpoints,
      discoveredDetailLinks: discoveries.detailLinks,
    },
  });

  await store.addSource(record);

  return {
    record,
    artifact,
    discoveries,
  };
}

export async function runFetchAdapter({ issuer, store }) {
  const seenUrls = new Set();
  const detailTargets = [];

  function markSeen(url) {
    if (seenUrls.has(url)) return false;
    seenUrls.add(url);
    return true;
  }

  for (const seed of issuer.seeds) {
    if (!markSeen(seed.url)) continue;

    try {
      const listing = await fetchAndStoreSource({
        store,
        issuer,
        sourceType: seed.sourceType || "listing_page",
        url: seed.url,
        allowDiscovery: true,
      });

      for (const detailLink of listing.discoveries.detailLinks) {
        if (markSeen(detailLink.url)) {
          detailTargets.push({
            ...detailLink,
            parentSourceId: listing.record.sourceId,
            discoveredFromUrl: listing.record.url,
          });
        }
      }
    } catch (error) {
      await store.addFailure({
        issuerId: issuer.issuerId,
        issuerName: issuer.issuerName,
        url: seed.url,
        sourceType: seed.sourceType || "listing_page",
        error: String(error),
      });
    }
  }

  await mapWithConcurrency(detailTargets, 4, async (detailTarget) => {
    try {
      const detail = await fetchAndStoreSource({
        store,
        issuer,
        sourceType: "detail_page",
        url: detailTarget.url,
        parentSourceId: detailTarget.parentSourceId,
        discoveredFromUrl: detailTarget.discoveredFromUrl,
        linkText: detailTarget.linkText,
        allowDiscovery: true,
      });

      const supplementalTargets = uniqueBy([
        ...detail.discoveries.pdfLinks,
        ...detail.discoveries.supplementalHtmlLinks,
        ...detail.discoveries.apiEndpoints,
      ], (item) => item.url)
        .filter((item) => markSeen(item.url))
        .slice(0, 12);

      await mapWithConcurrency(supplementalTargets, 3, async (target) => {
        try {
          const fetched = await fetchAndStoreSource({
            store,
            issuer,
            sourceType: target.sourceType,
            url: target.url,
            parentSourceId: detail.record.sourceId,
            discoveredFromUrl: detail.record.url,
            linkText: target.linkText,
            allowDiscovery: target.sourceType !== "api_response",
          });

          if (target.sourceType === "api_response" && !isLikelyJson(fetched.artifact.contentType, fetched.artifact.finalUrl)) {
            await store.addFailure({
              issuerId: issuer.issuerId,
              issuerName: issuer.issuerName,
              url: target.url,
              sourceType: target.sourceType,
              error: "Discovered API endpoint did not return JSON",
            });
          }
        } catch (error) {
          await store.addFailure({
            issuerId: issuer.issuerId,
            issuerName: issuer.issuerName,
            url: target.url,
            sourceType: target.sourceType,
            error: String(error),
          });
        }
      });
    } catch (error) {
      await store.addFailure({
        issuerId: issuer.issuerId,
        issuerName: issuer.issuerName,
        url: detailTarget.url,
        sourceType: "detail_page",
        error: String(error),
      });
    }
  });
}
