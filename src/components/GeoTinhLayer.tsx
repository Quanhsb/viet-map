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
import { Map as OLMap, Overlay } from 'ol';

function getRandomRGBA(alpha: number = 0.2): string {
  const r = Math.floor(Math.random() * 200);
  const g = Math.floor(Math.random() * 200);
  const b = Math.floor(Math.random() * 200);
  return `rgba(${r},${g},${b},${alpha})`;
}

interface Props {
  useMap: () => OLMap | null;
  onTinhSelect: (tenTinh: string | null) => void;
}

export const GeoTinhLayer = ({ useMap, onTinhSelect }: Props) => {
  const map = useMap();
  const provinceColorMap = useRef<Map<string, string>>(new Map());
  const hoverInteractionRef = useRef<Select | null>(null);
  const clickInteractionRef = useRef<Select | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<Overlay | null>(null);
  const hoveredFeatureRef = useRef<Feature<Geometry> | null>(null);

  useEffect(() => {
    if (!map) return;

    const vectorSource = new VectorSource<Feature<Geometry>>({
      url: '/data/DiaPhan_Tinh_2025.json',
      format: new GeoJSON(),
    });

    const styleFunction = (feature: FeatureLike): Style | void => {
      const code = feature.get('maTinh_BNV');
      if (!code) return;

      if (!provinceColorMap.current.has(code)) {
        provinceColorMap.current.set(code, getRandomRGBA(0.2));
      }

      const color = provinceColorMap.current.get(code)!;

      return new Style({
        stroke: new Stroke({ color: '#1e40af', width: 1.5 }),
        fill: new Fill({ color }),
      });
    };

    const layer = new VectorLayer({ source: vectorSource, style: styleFunction });
    map.addLayer(layer);

    // === Add popup overlay ===
    const popupContainer = document.createElement('div');
    popupContainer.id = 'popup';
    popupContainer.style.position = 'absolute';
    popupContainer.style.backgroundColor = 'white';
    popupContainer.style.padding = '8px';
    popupContainer.style.border = '1px solid black';
    popupContainer.style.borderRadius = '6px';
    popupContainer.style.minWidth = '200px';
    popupContainer.style.pointerEvents = 'none';
    popupContainer.style.zIndex = '1000';
    document.body.appendChild(popupContainer);
    popupRef.current = popupContainer;

    const overlay = new Overlay({
      element: popupContainer,
      positioning: 'bottom-center',
      stopEvent: false,
      offset: [0, -10],
    });
    overlayRef.current = overlay;
    map.addOverlay(overlay);

    // Hover interaction
    const hoverInteraction = new Select({
      condition: pointerMove,
      layers: [layer],
      style: (feature: FeatureLike): Style => {
        const code = feature.get('maTinh_BNV');
        let baseColor = provinceColorMap.current.get(code || '') || 'rgba(200,200,200,0.2)';
        baseColor = baseColor.replace(
          /rgba\((\d+),(\d+),(\d+),([^)]+)\)/,
          (_match, r, g, b) => `rgba(${r},${g},${b},0.5)`
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
      if (!feature && overlayRef.current) overlayRef.current.setPosition(undefined);
    });

    // Click interaction
    const clickInteraction = new Select({
      condition: click,
      layers: [layer],
      style: null,
    });

    clickInteraction.on('select', (e) => {
      const zoom = map.getView().getZoom() ?? 0;
      const feature = e.selected[0];

      if (feature && zoom < 10) {
        const tenTinh = feature.get('tenTinh');
        const maTinh = feature.get('maTinh_BNV');
        const dienTich = feature.get('dienTich');
        const danSo = feature.get('danSo');
        onTinhSelect(tenTinh); // 🔥 Gửi về App

        const coord = e.mapBrowserEvent.coordinate;
        const content = `
          <strong>${tenTinh}</strong><br/>
          <b>Mã tỉnh:</b> ${maTinh}<br/>
          <b>Diện tích:</b> ${dienTich} km²<br/>
          <b>Dân số:</b> ${danSo} người
        `;
        if (popupRef.current && overlayRef.current) {
          popupRef.current.innerHTML = content;
          overlayRef.current.setPosition(coord);
        }
      } else {
        onTinhSelect(null);
        if (overlayRef.current) overlayRef.current.setPosition(undefined);
      }
    });

    clickInteractionRef.current = clickInteraction;
    map.addInteraction(clickInteraction);

    // Handle zoom to toggle hover
    const handleViewChange = () => {
      const zoom = map.getView().getZoom();
      if (zoom === undefined) return;
      const interactions = map.getInteractions().getArray();
      if (zoom < 10 && !interactions.includes(hoverInteraction)) {
        map.addInteraction(hoverInteraction);
      } else if (zoom >= 10 && interactions.includes(hoverInteraction)) {
        map.removeInteraction(hoverInteraction);
        hoveredFeatureRef.current = null;
      }
    };

    map.getView().on('change:resolution', handleViewChange);
    handleViewChange();

    return () => {
      map.removeLayer(layer);
      map.getView().un('change:resolution', handleViewChange);
      if (hoverInteractionRef.current) map.removeInteraction(hoverInteractionRef.current);
      if (clickInteractionRef.current) map.removeInteraction(clickInteractionRef.current);
      if (overlayRef.current) map.removeOverlay(overlayRef.current);
      if (popupRef.current) popupRef.current.remove();
    };
  }, [map]);

  return null;
};
