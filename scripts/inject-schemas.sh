#!/usr/bin/env bash
# inject-schemas.sh — fetch canonical anolis schemas from a pinned GitHub release
# and place them under docs/public/schemas/anolis/ for VitePress to serve statically.
#
# The served URLs match the $id URIs in each schema:
#   https://anolishq.github.io/schemas/anolis/runtime/runtime-config.schema.json
#   https://anolishq.github.io/schemas/anolis/machine/machine-profile.schema.json
#   https://anolishq.github.io/schemas/anolis/telemetry/telemetry-timeseries.schema.v1.json
#   https://anolishq.github.io/schemas/anolis/http/runtime-http.openapi.v0.yaml
#
# Pin: schemas/anolis-version.json

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PIN_FILE="${ROOT}/schemas/anolis-version.json"
OUT_BASE="${ROOT}/docs/public/schemas/anolis"

if [ ! -f "${PIN_FILE}" ]; then
    echo "ERROR: schema pin file not found: ${PIN_FILE}" >&2
    exit 1
fi

VERSION=$(jq -r '.anolis_version' "${PIN_FILE}")
if [ -z "${VERSION}" ] || [ "${VERSION}" = "null" ]; then
    echo "ERROR: anolis_version not set in ${PIN_FILE}" >&2
    exit 1
fi

echo "Injecting anolis schemas v${VERSION} ..."

BASE_URL="https://github.com/anolishq/anolis/releases/download/v${VERSION}"

# Format: tarball | member path inside tarball | output path relative to OUT_BASE
SCHEMAS=(
    "anolis-${VERSION}-runtime-config-schema.tar.gz|schemas/runtime/runtime-config.schema.json|runtime/runtime-config.schema.json"
    "anolis-${VERSION}-machine-profile-schema.tar.gz|schemas/machine/machine-profile.schema.json|machine/machine-profile.schema.json"
    "anolis-${VERSION}-telemetry-schema.tar.gz|schemas/telemetry/telemetry-timeseries.schema.v1.json|telemetry/telemetry-timeseries.schema.v1.json"
    "anolis-${VERSION}-runtime-http-schema.tar.gz|schemas/http/runtime-http.openapi.v0.yaml|http/runtime-http.openapi.v0.yaml"
)

TMP=$(mktemp -d)
trap 'rm -rf "${TMP}"' EXIT

for entry in "${SCHEMAS[@]}"; do
    IFS='|' read -r tarball member outrel <<< "${entry}"
    url="${BASE_URL}/${tarball}"
    tarball_path="${TMP}/${tarball}"
    extract_dir="${TMP}/extract-${tarball%.tar.gz}"
    out_file="${OUT_BASE}/${outrel}"

    echo "  Fetching ${url} ..."
    curl -fsSL --retry 3 --retry-delay 2 -o "${tarball_path}" "${url}"

    mkdir -p "${extract_dir}"
    tar -xzf "${tarball_path}" -C "${extract_dir}" --no-same-owner

    src="${extract_dir}/${member}"
    if [ ! -f "${src}" ]; then
        echo "ERROR: expected member '${member}' not found in ${tarball}" >&2
        exit 1
    fi

    mkdir -p "$(dirname "${out_file}")"
    cp "${src}" "${out_file}"
    echo "  -> ${out_file#"${ROOT}/"}"
done

echo ""
echo "Schema injection complete (anolis v${VERSION})"
