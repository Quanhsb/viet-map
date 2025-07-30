import { useEffect } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';

interface MyMapProps {
  mapRef: React.RefObject<HTMLDivElement | null>;
  onMapReady: (map: Map) => void;
}

export function MyMap({ mapRef, onMapReady }: MyMapProps) {
  useEffect(() => {
    const target = mapRef.current;
    if (!target) return;

    const baseLayer = new TileLayer({
      source: new XYZ({
        url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      }),
    });

    const roadLayer = new TileLayer({
      source: new XYZ({
        url: 'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
      }),
    });

    const map = new Map({
      target,
      layers: [baseLayer, roadLayer],
      view: new View({
        center: [11710584.69, 2101345.02],
        zoom: 6,
        projection: 'EPSG:3857',
      }),
    });

    onMapReady(map);

    return () => map.setTarget(undefined);
  }, []);

  return <div className="w-full h-screen" ref={mapRef}></div>;
}
