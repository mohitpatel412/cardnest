import fs from "node:fs/promises";
import path from "node:path";

function padCounter(value) {
  return String(value).padStart(6, "0");
}

export async function createRawSourceStore({ rootDir, issuers }) {
  const generatedAt = new Date().toISOString();
  const crawlId = `crawl_${generatedAt.replace(/[:.]/g, "-")}`;
  const crawlDir = path.join(rootDir, "data", "raw_sources", "crawls", crawlId);
  const recordsDir = path.join(crawlDir, "records");
  const blobsDir = path.join(crawlDir, "blobs");
  const latestPath = path.join(rootDir, "data", "raw_sources", "latest.json");
  const manifestPath = path.join(crawlDir, "manifest.json");

  await fs.mkdir(recordsDir, { recursive: true });
  await fs.mkdir(blobsDir, { recursive: true });

  const manifest = {
    version: 1,
    crawlId,
    generatedAt,
    issuers: issuers.map((issuer) => issuer.issuerName),
    summary: {
      totalSources: 0,
      byType: {},
      byIssuer: {},
      failures: [],
    },
    paths: {
      recordsDir: path.relative(rootDir, recordsDir).replace(/\\/g, "/"),
      blobsDir: path.relative(rootDir, blobsDir).replace(/\\/g, "/"),
    },
    records: [],
  };

  const issuerCounters = new Map();

  async function writeManifest() {
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
    await fs.writeFile(latestPath, JSON.stringify({
      crawlId: manifest.crawlId,
      generatedAt: manifest.generatedAt,
      manifestPath: path.relative(rootDir, manifestPath).replace(/\\/g, "/"),
      totalSources: manifest.summary.totalSources,
      byType: manifest.summary.byType,
      byIssuer: manifest.summary.byIssuer,
      failures: manifest.summary.failures,
    }, null, 2), "utf8");
  }

  function nextSourceId(issuerId) {
    const nextValue = (issuerCounters.get(issuerId) || 0) + 1;
    issuerCounters.set(issuerId, nextValue);
    return `src_${issuerId}_${padCounter(nextValue)}`;
  }

  async function persistBlob(buffer, checksumSha256, extension) {
    const blobFilename = `${checksumSha256}.${extension || "bin"}`;
    const blobPath = path.join(blobsDir, blobFilename);

    try {
      await fs.access(blobPath);
    } catch {
      await fs.writeFile(blobPath, buffer);
    }

    return path.relative(rootDir, blobPath).replace(/\\/g, "/");
  }

  async function addFailure(failure) {
    manifest.summary.failures.push(failure);
    await writeManifest();
  }

  async function addSource(record) {
    manifest.summary.totalSources += 1;
    manifest.summary.byType[record.sourceType] = (manifest.summary.byType[record.sourceType] || 0) + 1;
    manifest.summary.byIssuer[record.issuerName] = (manifest.summary.byIssuer[record.issuerName] || 0) + 1;
    manifest.records.push({
      sourceId: record.sourceId,
      issuerId: record.issuerId,
      issuerName: record.issuerName,
      sourceType: record.sourceType,
      url: record.url,
      status: record.status,
      ok: record.ok,
      checksumSha256: record.checksumSha256,
      recordPath: `records/${record.sourceId}.json`,
    });

    const recordPath = path.join(recordsDir, `${record.sourceId}.json`);
    await fs.writeFile(recordPath, JSON.stringify(record, null, 2), "utf8");
    await writeManifest();
  }

  await writeManifest();

  return {
    crawlId,
    crawlDir,
    generatedAt,
    latestPath,
    manifestPath,
    nextSourceId,
    persistBlob,
    addSource,
    addFailure,
  };
}
