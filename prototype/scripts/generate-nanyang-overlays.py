#!/usr/bin/env python3
"""Generate display-only management-zone clips for county drill-down maps.

Requires Shapely for this one-time preprocessing step. The browser never performs
polygon intersection and the generated geometry never changes administrative
parentCode values.
"""
from __future__ import annotations

import json
from pathlib import Path

from shapely.geometry import GeometryCollection, MultiPolygon, Polygon, mapping, shape
from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parents[1]
MAP_ROOT = ROOT / "assets" / "maps" / "nanyang"
COUNTIES = ("411302", "411303", "411322")
ZONE_CODES = ("411371", "411372")


def read_json(path: Path):
    with path.open(encoding="utf-8-sig") as handle:
        return json.load(handle)


def polygonal_only(geometry):
    if geometry.is_empty:
        return None
    if isinstance(geometry, Polygon):
        return MultiPolygon([geometry])
    if isinstance(geometry, MultiPolygon):
        return geometry
    if isinstance(geometry, GeometryCollection):
        polygons = []
        for part in geometry.geoms:
            normalized = polygonal_only(part)
            if normalized:
                polygons.extend(normalized.geoms)
        return MultiPolygon(polygons) if polygons else None
    return None


def main() -> None:
    city = read_json(MAP_ROOT / "city" / "411300.geojson")
    county_geometry = {
        str(feature["properties"]["adcode"]): shape(feature["geometry"])
        for feature in city["features"]
    }
    zone_features = []
    for code in ZONE_CODES:
        zone_features.extend(read_json(MAP_ROOT / "management-zones" / f"{code}.geojson")["features"])

    output_dir = MAP_ROOT / "derived-overlays"
    output_dir.mkdir(parents=True, exist_ok=True)
    for county_code in COUNTIES:
        county = county_geometry[county_code]
        clips = []
        for feature in zone_features:
            clipped = polygonal_only(shape(feature["geometry"]).intersection(county))
            if not clipped or clipped.area == 0:
                continue
            properties = dict(feature["properties"])
            properties.update(
                {
                    "renderOnly": True,
                    "isManagementZone": True,
                    "sourceRegionCode": properties["parentCode"],
                    "displayCountyCode": county_code,
                }
            )
            clips.append({"type": "Feature", "properties": properties, "geometry": mapping(clipped)})
        collection = {
            "type": "FeatureCollection",
            "name": f"{county_code}-management-zone-display-overlay",
            "features": clips,
        }
        path = output_dir / f"{county_code}.management-zones.geojson"
        path.write_text(json.dumps(collection, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        print(f"{county_code}: {len(clips)} clipped feature(s) -> {path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
