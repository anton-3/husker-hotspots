"use client";

import { useMemo } from "react";
import { HeatmapLayer } from "@deck.gl/aggregation-layers";
import { GeoJsonLayer } from "@deck.gl/layers";
import { BUILDINGS, BUILDING_TYPE_COLORS, type Building } from "@/lib/map/buildings";
import type { BuildingOccupancy, HeatmapPoint } from "@/lib/map/mock-data";
import type { DataSourceId } from "@/lib/map/config";

// 使用图层钩子参数
interface 使用图层参数 {
  heatmapPoints: HeatmapPoint[];
  buildingOccupancies: BuildingOccupancy[];
  selectedBuildingId: string | null;
  hoveredBuildingId: string | null;
  activeSources: Set<DataSourceId>;
  onBuildingClick: (building: Building) => void;
  onBuildingHover: (buildingId: string | null) => void;
}

export function useMapLayers({
  heatmapPoints: 热力点列表,
  buildingOccupancies: 楼宇占用列表,
  selectedBuildingId: 已选楼宇ID,
  hoveredBuildingId: 悬停楼宇ID,
  activeSources: 激活数据源,
  onBuildingClick: 点击楼宇回调,
  onBuildingHover: 悬停楼宇回调,
}: 使用图层参数) {
  // 根据激活的数据源过滤热力图点位
  const 过滤后的点位 = useMemo<HeatmapPoint[]>(() => {
    if (激活数据源.size === 7) return 热力点列表; // 全部激活
    // 简化处理：根据激活数据源数量按比例调整权重
    const 比例 = 激活数据源.size / 7;
    return 热力点列表.map((点: HeatmapPoint) => ({ ...点, weight: 点.weight * 比例 }));
  }, [热力点列表, 激活数据源]);

  const 图层集合 = useMemo(() => {
    // 基于楼宇数据构建 GeoJSON 要素
    const 楼宇要素列表 = BUILDINGS.map((楼宇: Building) => {
      const 占用记录 = 楼宇占用列表.find((项: BuildingOccupancy) => 项.buildingId === 楼宇.id);
      const 占用率 = 占用记录?.occupancyPercent ?? 0;
      const 是否选中 = 楼宇.id === 已选楼宇ID;
      const 是否悬停 = 楼宇.id === 悬停楼宇ID;

      return {
        type: "Feature" as const,
        geometry: {
          type: "Polygon" as const,
          coordinates: [楼宇.polygon],
        },
        properties: {
          id: 楼宇.id,
          name: 楼宇.name,
          type: 楼宇.type,
          occupancy: 占用率,
          isSelected: 是否选中,
          isHovered: 是否悬停,
        },
      };
    });

    const 楼宇GeoJson = {
      type: "FeatureCollection" as const,
      features: 楼宇要素列表,
    };

    return [
      // 校园整体活动热力图图层
      new HeatmapLayer({
        id: "campus-heatmap",
        data: 过滤后的点位,
        getPosition: (点: HeatmapPoint) => 点.coordinates,
        getWeight: (点: HeatmapPoint) => 点.weight,
        radiusPixels: 60,
        intensity: 1.2,
        threshold: 0.05,
        colorRange: [
          [34, 197, 94, 80],     // green (low)
          [132, 204, 22, 120],   // lime
          [234, 179, 8, 160],    // yellow
          [249, 115, 22, 180],   // orange
          [239, 68, 68, 200],    // red (high)
          [220, 38, 38, 230],    // dark red (critical)
        ],
        opacity: 0.7,
      }),

      // 楼宇轮廓多边形（可交互）
      new GeoJsonLayer({
        id: "building-footprints",
        data: 楼宇GeoJson,
        pickable: true,
        stroked: true,
        filled: true,
        extruded: false,
        getFillColor: (要素: any) => {
          const 基础颜色 = 十六进制转RGB(
            BUILDING_TYPE_COLORS[要素.properties.type as Building["type"]] || "#6b7280"
          );
          if (要素.properties.isSelected) return [...基础颜色, 140];
          if (要素.properties.isHovered) return [...基础颜色, 100];
          return [...基础颜色, 40];
        },
        getLineColor: (要素: any) => {
          const 基础颜色 = 十六进制转RGB(
            BUILDING_TYPE_COLORS[要素.properties.type as Building["type"]] || "#6b7280"
          );
          if (要素.properties.isSelected) return [...基础颜色, 255];
          if (要素.properties.isHovered) return [...基础颜色, 200];
          return [...基础颜色, 80];
        },
        getLineWidth: (要素: any) =>
          要素.properties.isSelected ? 3 : 要素.properties.isHovered ? 2 : 1,
        lineWidthUnits: "pixels" as const,
        onClick: (信息: { object?: (typeof 楼宇要素列表)[0] }) => {
          if (信息.object) {
            const 楼宇 = BUILDINGS.find(
              (项) => 项.id === 信息.object!.properties.id
            );
            if (楼宇) 点击楼宇回调(楼宇);
          }
        },
        onHover: (信息: { object?: (typeof 楼宇要素列表)[0] }) => {
          悬停楼宇回调(信息.object?.properties.id ?? null);
        },
        updateTriggers: {
          getFillColor: [已选楼宇ID, 悬停楼宇ID],
          getLineColor: [已选楼宇ID, 悬停楼宇ID],
          getLineWidth: [已选楼宇ID, 悬停楼宇ID],
        },
      }),
    ];
  }, [
    过滤后的点位,
    楼宇占用列表,
    已选楼宇ID,
    悬停楼宇ID,
    点击楼宇回调,
    悬停楼宇回调,
  ]);

  return 图层集合;
}

function 十六进制转RGB(hex: string): [number, number, number] {
  const 匹配结果 = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return 匹配结果
    ? [
        parseInt(匹配结果[1], 16),
        parseInt(匹配结果[2], 16),
        parseInt(匹配结果[3], 16),
      ]
    : [107, 114, 128];
}
