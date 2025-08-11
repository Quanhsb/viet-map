import { useEffect, useRef } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import { Button } from '@/components/ui/button';

interface MyMapProps {
  mapRef: React.RefObject<HTMLDivElement | null>;
  onMapReady: (map: Map) => void;
}

export function MyMap({ mapRef, onMapReady }: MyMapProps) {
  const baseLayerRef = useRef<TileLayer<XYZ> | null>(null);
  const satelliteLayerRef = useRef<TileLayer<XYZ> | null>(null);

  useEffect(() => {
    const target = mapRef.current;
    if (!target) return;

    const baseLayer = new TileLayer<XYZ>({
      visible: true,
      source: new XYZ({
        url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      }),
    });

    const satelliteLayer = new TileLayer<XYZ>({
      visible: false,
      source: new XYZ({
        url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      }),
    });

    const roadLayer = new TileLayer<XYZ>({
      source: new XYZ({
        url: 'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
      }),
    });

    baseLayerRef.current = baseLayer;
    satelliteLayerRef.current = satelliteLayer;

    const map = new Map({
      target,
      layers: [baseLayer, satelliteLayer, roadLayer],
      view: new View({
        center: [11710584.69, 2101345.02],
        zoom: 6,
        projection: 'EPSG:3857',
      }),
    });

    (window as any).toggleBaseLayer = () => {
      const topo = baseLayerRef.current;
      const satellite = satelliteLayerRef.current;
      if (topo && satellite) {
        const isTopoVisible = topo.getVisible();
        topo.setVisible(!isTopoVisible);
        satellite.setVisible(isTopoVisible);
      }
    };

    onMapReady(map);
    return () => map.setTarget(undefined);
  }, []);

  return (
  <div className="w-full h-screen relative">
    <div ref={mapRef} className="w-full h-full" />
    <div className="absolute top-16 right-4 z-10">
      <Button onClick={() => (window as any).toggleBaseLayer()}>
        Chuyển bản đồ nền
      </Button>
    </div>
  </div>
);
}
