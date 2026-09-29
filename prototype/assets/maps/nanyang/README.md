# Nanyang Township Dataset｜清洗版 V1.0

## 用途
用于研判助手【全域态势】中“南阳市 → 13个县级行政区 → 乡镇/街道”的地图下钻 Demo。该数据不是权威生产行政界线，正式公安生产环境仍应替换为自然资源部门/天地图/甲方 GIS 权威数据。

## 本次清洗做了什么
- 原始乡镇 Polygon：254 个。
- 删除 properties.geom 重复 WKB 字段，保留标准 GeoJSON geometry。
- 修复 5 个无效 Geometry，并统一输出为有效 MultiPolygon。
- 标准化“街道办事处 → 街道”“风景区办事处 → 风景区”等展示名称；同编码命中 2020/2023 代码表时优先使用参考表规范名称。
- 拆分 13 个法定县级行政区（247 个 Polygon）与 2 个功能区（7 个 Polygon）。
- 建立 2020、2023 参考表、Polygon 对比表、区县覆盖率表及 2020→2023 版本差异表。
- 对 7 个历史/旧版代码仅提供 successor candidate，不自动把旧 Polygon 改挂到新编码，避免伪造行政边界。

## 目录
- `geojson/all-townships.cleaned.geojson`：全部 254 个清洗后 Polygon。
- `geojson/legal-counties-only.cleaned.geojson`：13 个法定区县下 247 个 Polygon。
- `geojson/management-zones-only.cleaned.geojson`：411371/411372 共 7 个功能区 Polygon。
- `geojson/13-counties/`：按 6 位县级码拆分，可直接对应 `loadRegionMap(parentCode)`。
- `geojson/management-zones/`：功能区单独文件。
- `metadata/feature-index.csv`：全部 Feature 索引与版本状态。
- `metadata/geometry-repair-log.csv`：5 个 Geometry 修复记录。
- `metadata/name-normalization-log.csv`：名称标准化记录。
- `metadata/reference-2020.csv`、`reference-2023.csv`：校验基准。
- `metadata/polygon-vs-2020.csv`、`polygon-vs-2023.csv`：逐编码差异。
- `metadata/coverage-by-county.csv`：13 区县覆盖率。
- `metadata/version-diff-2020-2023.csv`：2020→2023 代码表变化。
- `metadata/legacy-successor-candidates.csv`：历史代码候选后继关系，仅用于人工核验。
- `metadata/dataset-manifest.json`：数量、哈希与版本信息。

## 关键结果
- 13 区县 Polygon：247；2020 参考：248；精确代码命中 240（96.77%）。
- 2023 参考：249；相对 2020 新增 `411322004 广安街道`。
- 功能区：411371（3）、411372（4），不计入 13 区县统计分母，但应作为地图 Overlay 保留。
- 5 个原始无效 Geometry 已全部修复；清洗后 254/254 Geometry 有效。

## 前端字段
每个 Feature 只保留面向前端/追溯所需字段：
`regionCode, sourceCode, name, sourceName, parentCode, parentName, regionLevel, regionType, isManagementZone, source, sourceVersion, geometryRepaired, match2020, match2023`。

## 重要限制
原始锐多宝包内《说明.txt》明确写明数据仅供学术研究、教育学习等参考用途并禁止商用。本清洗不改变原始数据的许可条件。原说明保存在 `source/SOURCE_说明.txt`。
## Runtime payload optimization

The per-county files in `townships/` are browser runtime assets. They are minified and topology-preserving simplified at `0.00002` degrees (about two metres locally) so each lazy-loaded payload stays below 1 MiB. Administrative codes, names, parent relationships, and source metadata are unchanged. Rebuild them with `prototype/scripts/optimize-nanyang-runtime-geojson.py`; the source ZIP remains untouched.
