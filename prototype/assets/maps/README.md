# 南阳市行政区边界

`411300.json` 来源：用户指定的 B1gF4ceC4t/map-json-data 仓库 `china/411300.json`。
下载：2026-09-22，经 GitHub Contents API 获取完整文件并解码 UTF-8 BOM（raw 下载不完整未采用）。
源：https://github.com/B1gF4ceC4t/map-json-data/blob/master/china/411300.json

源文件仅有 properties.name；导入时按已验证的南阳市13区县对照表补充 properties.adcode，坐标和几何不修改。运行时仅通过 adcode join 指标，不通过名称 join。
严格校验 FeatureCollection、13个 feature、无重复代码、完整预期代码集合与 Polygon/MultiPolygon 坐标。
它是仓库提供的行政区划快照，不是公安权威边界；生产使用须审核来源许可、边界时效及坐标基准。

前端只读取本地文件，不在运行时请求 GitHub；县级/街道级边界暂未接入，不用合成 geometry 降级。原 `411300_full.json`（DataV 来源）已由上述文件替换。
