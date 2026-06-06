# Credit Card Pipeline - Phase 1

## Objective

Phase 1 replaces the existing scraper-centric flow with an acquisition-first pipeline. The acquisition layer collects raw source artifacts only and does not infer benefits, fees, reward rates, or recommendation signals.

## Target Folder Structure

```text
data/
  raw_sources/
    latest.json
    crawls/
      <crawlId>/
        manifest.json
        records/
          <sourceId>.json
        blobs/
          <sha256>.<ext>

docs/
  credit-card-pipeline-phase1.md

schemas/
  raw-source.schema.json

scripts/
  acquisition/
    adapters/
      fetch-adapter.mjs
      index.mjs
    config/
      issuers.mjs
    lib/
      discovery.mjs
      fs-store.mjs
      http-client.mjs
      utils.mjs
    run-acquisition.mjs
  scrape-credit-cards.mjs
```

## Runtime Flow

```text
issuer seeds
  -> fetch listing pages
  -> discover detail pages
  -> fetch detail pages
  -> discover PDFs / FAQ pages / API endpoints
  -> fetch downloadable assets
  -> persist raw source records + content blobs + crawl manifest
```

## Filesystem-Backed `raw_sources`

Phase 1 uses a filesystem-backed raw source store that mirrors the future `raw_sources` table.

### Crawl Manifest

Each acquisition run writes `data/raw_sources/crawls/<crawlId>/manifest.json`.

```json
{
  "version": 1,
  "crawlId": "crawl_2026-06-06T14-10-22-111Z",
  "generatedAt": "2026-06-06T14:10:22.111Z",
  "issuers": ["SBI Card", "HDFC Bank"],
  "summary": {
    "totalSources": 0,
    "byType": {},
    "byIssuer": {},
    "failures": []
  }
}
```

### Raw Source Record

Each fetched artifact writes one record under `records/<sourceId>.json`.

```json
{
  "sourceId": "src_sbi_000001",
  "crawlId": "crawl_2026-06-06T14-10-22-111Z",
  "issuerId": "sbi",
  "issuerName": "SBI Card",
  "strategy": "fetch",
  "sourceType": "detail_page",
  "parentSourceId": "src_sbi_000000",
  "url": "https://www.sbicard.com/en/personal/credit-cards/cashback-sbi-card.page",
  "canonicalUrl": "https://www.sbicard.com/en/personal/credit-cards/cashback-sbi-card.page",
  "discoveredFromUrl": "https://www.sbicard.com/en/personal/credit-cards.html",
  "method": "GET",
  "status": 200,
  "ok": true,
  "contentType": "text/html; charset=UTF-8",
  "contentLength": 153802,
  "checksumSha256": "6f6d...",
  "fetchedAt": "2026-06-06T14:10:30.512Z",
  "storage": {
    "blobPath": "data/raw_sources/crawls/crawl_2026-06-06T14-10-22-111Z/blobs/6f6d....html"
  },
  "metadata": {
    "title": "Cashback SBI Card",
    "linkText": "Cashback SBI Card",
    "discoveredPdfLinks": [],
    "discoveredHtmlLinks": [],
    "discoveredApiEndpoints": []
  }
}
```

### Blob Storage

- HTML, JSON, and text payloads are stored as raw blobs.
- PDFs are stored as binary blobs with SHA-256-based filenames.
- Multiple records may point to the same blob if content is identical.

## Proposed Database Schema

Phase 1 persists to disk, but the schema below is the database target and should remain stable across later phases.

### `crawl_logs`

```sql
create table crawl_logs (
  crawl_id text primary key,
  started_at timestamptz not null,
  finished_at timestamptz,
  status text not null,
  triggered_by text,
  config jsonb not null,
  summary jsonb not null default '{}'::jsonb
);
```

### `raw_sources`

```sql
create table raw_sources (
  source_id text primary key,
  crawl_id text not null references crawl_logs(crawl_id),
  issuer_id text not null,
  issuer_name text not null,
  strategy text not null,
  source_type text not null,
  parent_source_id text references raw_sources(source_id),
  card_key text,
  url text not null,
  canonical_url text,
  discovered_from_url text,
  http_method text not null default 'GET',
  http_status integer,
  ok boolean not null default false,
  content_type text,
  content_length integer,
  checksum_sha256 text not null,
  blob_uri text not null,
  fetched_at timestamptz not null,
  metadata jsonb not null default '{}'::jsonb
);

create index raw_sources_crawl_idx on raw_sources(crawl_id);
create index raw_sources_issuer_idx on raw_sources(issuer_id);
create index raw_sources_type_idx on raw_sources(source_type);
create index raw_sources_parent_idx on raw_sources(parent_source_id);
```

### Future Phase Tables

These are not implemented in Phase 1 but define the stable downstream contract:

```sql
create table cards (
  card_id text primary key,
  issuer text not null,
  card_name text not null,
  created_at timestamptz not null default now()
);

create table card_versions (
  card_version_id text primary key,
  card_id text not null references cards(card_id),
  effective_from date not null,
  effective_to date,
  annual_fee integer,
  joining_fee integer,
  fee_waiver_spend integer,
  forex_markup numeric(6,2),
  min_age integer,
  max_age integer,
  income_requirement integer,
  source_bundle_id text,
  created_at timestamptz not null default now()
);

create table reward_rules (...);
create table reward_caps (...);
create table reward_exclusions (...);
create table welcome_benefits (...);
create table milestone_benefits (...);
create table lounge_benefits (...);
create table fee_rules (...);
create table persona_scores (...);
create table recommendation_scores (...);
```

## Issuer Adapter Contract

Each issuer adapter should remain issuer-agnostic at the pipeline level and only isolate source discovery details.

```ts
type IssuerAdapter = {
  strategy: "fetch" | "playwright";
  acquire(context: AcquisitionContext): Promise<AcquisitionSummary>;
};
```

Adapter responsibilities:

- define issuer seeds
- discover card detail URLs
- discover PDF / FAQ / terms links
- discover candidate API endpoints
- fetch and persist raw artifacts

Adapter non-responsibilities:

- extract fees or rewards
- infer personas
- generate recommendation scores
- normalize card facts

## Phase Boundaries

### Phase 1

- acquisition only
- raw sources persisted
- checksum-based blobs
- issuer adapter architecture

### Phase 2

- AI extraction over source bundles
- structured facts with confidence
- validation and contradiction detection

### Phase 3

- versioned normalization
- enrichment and persona scoring
- annual value recommendation engine
