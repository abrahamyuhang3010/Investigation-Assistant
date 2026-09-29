# 南阳市乡级地图数据使用说明

## 数据身份

- 数据集：Nanyang Township Dataset V1.0 cleaned
- 运行时用途：研判助手【全域态势】演示中的“南阳市 → 13 个法定县级行政区 → 乡镇/街道”地图下钻
- 数据版本判断：`mixed-legacy~2018-2020`
- 本数据不是“2020 年权威行政区划数据”，也不是可直接用于公安生产环境的法定行政界线。

## 来源与许可限制

源包声明来源为锐多宝（map.ruiduobao.com），仅供学术研究、教育学习等参考用途，并明确禁止商业使用。清洗、拆分、裁剪展示层不会改变原数据许可条件。

因此：

1. 当前数据只适用于非商业原型、技术验证和内部演示。
2. 上线或商业化前必须由数据权利人与项目法务复核授权。
3. 正式公安生产环境必须替换为自然资源部门、天地图或甲方 GIS 提供的权威且可授权数据。

原始声明保存在同目录的 `SOURCE_说明.txt`。

## 数据口径

- 13 个法定县级行政区下乡级 Polygon：247
- 功能区 Polygon：7（411371 为 3 个，411372 为 4 个）
- 清洗后总 Polygon：254
- 修复 Geometry：5
- 修复后有效 Geometry：254 / 254
- 2020 参考单位：248
- 2023 参考单位：249

`411322004 广安街道` 是 2023 参考表新增项，但源 Polygon 中不存在对应边界。系统只保留 `missing_geometry` 元数据，不绘制、不伪造、不手工补边界。

## 历史编码与版本差异

历史代码保留原 `regionCode` 与 `sourceCode`。`legacy-successor-candidates.csv` 仅记录候选后继关系并明确标记 `do_not_auto_remap_geometry`；运行时代码不会自动改挂 Polygon。

2020/2023 差异保存在：

- `coverage-by-county.csv`
- `version-diff-2020-2023.csv`
- `legacy-successor-candidates.csv`
- `feature-index.csv`
- `dataset-manifest.json`

## 功能区展示

411371 与 411372 不加入 13 个法定县级层级、Global Scope 或统计分母。为避免宛城区、卧龙区、方城县下钻图出现不易理解的空间空洞，离线预处理生成裁剪后的展示覆盖层：

- 宛城区：6 个裁剪片段
- 卧龙区：4 个裁剪片段
- 方城县：1 个裁剪片段

这些片段均标记 `renderOnly: true`，保留原 `parentCode`，并通过 `displayCountyCode` 说明当前显示县。空间相交只用于地图显示，不表示功能区行政归属发生变化。

## 运行时加载

首屏只请求 `city/411300.geojson`。进入县级 Scope 后才按需请求一个 `townships/{countyCode}.geojson`，必要时再请求对应裁剪覆盖层。运行时不包含或加载约 10 MB 的 `all-townships.cleaned.geojson`，并使用内存缓存避免同一辖区重复请求。
