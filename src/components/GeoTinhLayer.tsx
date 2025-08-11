import { useEffect, useRef } from 'react';
import { Vector as VectorLayer } from 'ol/layer';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import { Fill, Stroke, Style } from 'ol/style';
import { pointerMove, click } from 'ol/events/condition';
import { Select } from 'ol/interaction';
import Feature from 'ol/Feature';
import Geometry from 'ol/geom/Geometry';
import { FeatureLike } from 'ol/Feature';
import { Map as OLMap } from 'ol';

function getRandomRGBA(alpha: number = 0.2): string {
  const r = Math.floor(Math.random() * 200);
  const g = Math.floor(Math.random() * 200);
  const b = Math.floor(Math.random() * 200);
  return `rgba(${r},${g},${b},${alpha})`;
}

interface Props {
  useMap: () => OLMap | null;
  onTinhSelect: (tenTinh: string | null) => void;
  isHoverEnabled: boolean;
}

export const GeoTinhLayer = ({ useMap, onTinhSelect, isHoverEnabled }: Props) => {
  const map = useMap();
  const provinceColorMap = useRef<Map<string, string>>(new Map());
  const hoverInteractionRef = useRef<Select | null>(null);
  const clickInteractionRef = useRef<Select | null>(null);
  const hoveredFeatureRef = useRef<Feature<Geometry> | null>(null);
  const layerRef = useRef<VectorLayer<Feature<Geometry>> | null>(null);

  // effect 1: tạo layer ranh giới + click interaction
  useEffect(() => {
    if (!map) return;

    const vectorSource = new VectorSource<Feature<Geometry>>({
      url: '/data/DiaPhan_Tinh_2025.json',
      format: new GeoJSON(),
    });

    const borderOnlyStyle = new Style({
      stroke: new Stroke({ color: '#1e40af', width: 1.5 }),
      fill: new Fill({ color: 'rgba(0,0,0,0)' }),
    });

    const layer = new VectorLayer({ source: vectorSource, style: borderOnlyStyle });
    layerRef.current = layer;
    map.addLayer(layer);

    // hover interaction
    const hoverInteraction = new Select({
      condition: pointerMove,
      layers: [layer],
      style: (feature: FeatureLike): Style => {
        const code = feature.get('maTinh_BNV');
        let baseColor = provinceColorMap.current.get(code || '') || 'rgba(200,200,200,0.2)';
        baseColor = baseColor.replace(
          /rgba\((\d+),(\d+),(\d+),([^)]+)\)/,
          (_match, r, g, b) => `rgba(${r},${g},${b},0.25)`
        );
        return new Style({
          stroke: new Stroke({ color: '#000', width: 2 }),
          fill: new Fill({ color: baseColor }),
        });
      },
    });
    hoverInteractionRef.current = hoverInteraction;
    hoverInteraction.on('select', (e) => {
      const feature = e.selected[0] || null;
      hoveredFeatureRef.current = feature;
    });

    // hiệu ứng click  
    const clickInteraction = new Select({
      condition: click,
      layers: [layer],
      style: null,
    });
    clickInteractionRef.current = clickInteraction;
    clickInteraction.on('select', (e) => {
      const zoom = map.getView().getZoom() ?? 0;
      const feature = e.selected[0];
      if (feature && zoom < 11.5) {
        const tenTinh = feature.get('tenTinh');
        onTinhSelect(tenTinh);
      } else {
        onTinhSelect(null);
      }
    });
    map.addInteraction(clickInteraction);

    return () => {
      map.removeLayer(layer);
      if (hoverInteractionRef.current) map.removeInteraction(hoverInteractionRef.current);
      if (clickInteractionRef.current) map.removeInteraction(clickInteractionRef.current);
    };
  }, [map, onTinhSelect]);

  // effect 2: tô màu hoặc bỏ màu
  useEffect(() => {
    if (!map || !layerRef.current) return;

    const styleFunction = (feature: FeatureLike): Style | void => {
      const code = feature.get('maTinh_BNV');
      if (!code) return;
      if (!provinceColorMap.current.has(code)) {
        provinceColorMap.current.set(code, getRandomRGBA(0.2));
      }
      const color = isHoverEnabled
        ? provinceColorMap.current.get(code)!
        : 'rgba(0,0,0,0)';

      return new Style({
        stroke: new Stroke({ color: '#1e40af', width: 1.5 }),
        fill: new Fill({ color }),
      });
    };

    layerRef.current.setStyle(styleFunction);
    layerRef.current.changed();
  }, [map, isHoverEnabled]);

  // effect 3: điều khiển hover interaction theo zoom và isHoverEnabled
  useEffect(() => {
    if (!map || !hoverInteractionRef.current) return;

    const hoverInteraction = hoverInteractionRef.current;
    const updateHoverState = () => {
      const zoom = map.getView().getZoom() ?? 0;
      const interactions = map.getInteractions().getArray();
      if (isHoverEnabled && zoom < 10 && !interactions.includes(hoverInteraction)) {
        map.addInteraction(hoverInteraction);
      } else if ((!isHoverEnabled || zoom >= 10) && interactions.includes(hoverInteraction)) {
        map.removeInteraction(hoverInteraction);
        hoveredFeatureRef.current = null;
      }
    };

    map.getView().on('change:resolution', updateHoverState);
    updateHoverState();

    return () => {
      map.getView().un('change:resolution', updateHoverState);
    };
  }, [map, isHoverEnabled]);

  return null;
};
