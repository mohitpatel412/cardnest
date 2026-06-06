import crypto from "node:crypto";
import { REQUEST_HEADERS, getFileExtensionFromContentType, sleep } from "./utils.mjs";

function headersToObject(headers) {
  const result = {};
  for (const [key, value] of headers.entries()) {
    result[key] = value;
  }
  return result;
}

export async function fetchArtifact(url, { retries = 4, timeoutMs = 30000 } = {}) {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        headers: REQUEST_HEADERS,
        redirect: "follow",
        signal: controller.signal,
      });

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const contentType = response.headers.get("content-type") || "";
      const checksumSha256 = crypto.createHash("sha256").update(buffer).digest("hex");

      return {
        url,
        finalUrl: response.url || url,
        ok: response.ok,
        status: response.status,
        contentType,
        contentLength: buffer.length,
        checksumSha256,
        headers: headersToObject(response.headers),
        buffer,
        text: /^text\/|application\/json|application\/xml|javascript/i.test(contentType)
          ? buffer.toString("utf8")
          : null,
        extension: getFileExtensionFromContentType(contentType),
      };
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await sleep(800 * (attempt + 1));
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError;
}
