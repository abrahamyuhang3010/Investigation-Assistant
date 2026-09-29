#!/usr/bin/env python3
"""Optimize township GeoJSON used by the browser without changing region metadata.

The source dataset is intentionally kept outside the runtime bundle. This script
applies a very small, topology-preserving simplification (roughly two metres at
Nanyang's latitude) and writes minified FeatureCollections for static delivery.
It is safe to rerun: already simplified geometries remain valid and stable.
"""
from __future__ import annotations

import json
from pathlib import Path

from shapely.geometry import GeometryCollection, MultiPolygon, Polygon, mapping, shape
from shapely.validation import make_valid

ROOT = Path(__file__).resolve().parents[1]
TOWNSHIP_DIR = ROOT / "assets" / "maps" / "nanyang" / "townships"
TOLERANCE_DEGREES = 0.00002
MAX_RUNTIME_BYTES = 1024 * 1024


def read_json(path: Path):
    with path.open(encoding="utf-8-sig") as handle:
        return json.load(handle)


def polygonal_only(geometry):
    if geometry.is_empty:
        return None
    if isinstance(geometry, (Polygon, MultiPolygon)):
        return geometry
    if isinstance(geometry, GeometryCollection):
        polygons = []
        for part in geometry.geoms:
            normalized = polygonal_only(part)
            if isinstance(normalized, Polygon):
                polygons.append(normalized)
            elif isinstance(normalized, MultiPolygon):
                polygons.extend(normalized.geoms)
        return MultiPolygon(polygons) if polygons else None
    return None


def main() -> None:
    paths = sorted(TOWNSHIP_DIR.glob("*.geojson"))
    if not paths:
        raise SystemExit(f"No township GeoJSON files found in {TOWNSHIP_DIR}")

    for path in paths:
        collection = read_json(path)
        if collection.get("type") != "FeatureCollection":
            raise ValueError(f"{path.name}: expected FeatureCollection")

        optimized_features = []
        for index, feature in enumerate(collection.get("features", [])):
            geometry = shape(feature.get("geometry"))
            simplified = geometry.simplify(TOLERANCE_DEGREES, preserve_topology=True)
            if simplified.is_empty or simplified.geom_type not in {"Polygon", "MultiPolygon"}:
                raise ValueError(f"{path.name} feature {index}: simplification removed polygon geometry")
            if not simplified.is_valid:
                simplified = polygonal_only(make_valid(simplified))
            if simplified is None or simplified.is_empty or not simplified.is_valid:
                raise ValueError(f"{path.name} feature {index}: simplified geometry is invalid")
            optimized_features.append(
                {
                    **feature,
                    "properties": dict(feature.get("properties") or {}),
                    "geometry": mapping(simplified),
                }
            )

        output = {**collection, "features": optimized_features}
        before = path.stat().st_size
        path.write_text(
            json.dumps(output, ensure_ascii=False, separators=(",", ":")),
            encoding="utf-8",
        )
        after = path.stat().st_size
        budget = "OK" if after < MAX_RUNTIME_BYTES else "OVER 1 MiB"
        print(f"{path.name}: {before:,} -> {after:,} bytes ({budget})")


if __name__ == "__main__":
    main()
