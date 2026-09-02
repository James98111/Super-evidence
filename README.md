# Australian Super Transparency — $0 Prototype

A static, GitHub Pages-ready prototype proving the core proposition:

> **Every number has a source.**

This first version compares **Australian Retirement Trust High Growth** with **Aware Super High Growth** using structured evidence-backed data. It deliberately requires no database, server, paid hosting, package installation or build step.

## What it proves

- side-by-side option comparison
- current portfolio composition
- growth / defensive exposure
- 1 / 3 / 5 / 10-year performance fields
- investment and administration fee calculator
- historical strategic allocation view
- evidence drawer for metrics
- verification statuses and source-quality warnings
- issuer vs regulatory methodology separation

## Run locally

Any static web server works. For example, from this folder run a local web server and open `index.html` through it. The site reads its data from `data/options.json`.

## Publish free with GitHub Pages

1. Create a **public GitHub repository**.
2. Upload all files in this folder to the repository root.
3. In GitHub, open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Choose the `main` branch and `/ (root)` folder.
6. Save. GitHub will provide the public Pages URL once deployed.

No paid service is required.

## Data philosophy

The prototype keeps four separate concepts:

1. issuer-reported facts
2. regulator/APRA facts
3. platform-derived values
4. secondary cross-checks

A secondary source is never silently promoted to an issuer-verified fact. If an exact issuer value has not yet been machine-extracted, the UI says so.

## Production migration

The JSON structure intentionally mirrors the production evidence-ledger architecture in `foundation/`. Later it can be migrated into PostgreSQL/Supabase without redesigning the public data contract.
