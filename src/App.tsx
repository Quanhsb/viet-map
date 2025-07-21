import { createContext, useContext, useRef, useEffect, useState } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import { GeoTinhLayer } from './components/GeoTinhLayer';
import LocateButton from './components/LocateButton'; // ✅ Import LocateButton
import { toLonLat } from 'ol/proj';
import 'ol/ol.css';

const MapContext = createContext<Map | null>(null);
const useMap = () => useContext(MapContext);

function App() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<Map | null>(null);
  const [zoom, setZoom] = useState<number>(0);
  const [coords, setCoords] = useState<[number, number]>([0, 0]);

  useEffect(() => {
    const targetElement = mapRef.current;
    if (!targetElement) return;

    const mapObject = new Map({
      target: targetElement,
      layers: [
        new TileLayer({
          source: new XYZ({
            url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
          }),
        }),
      ],
      view: new View({
        center: [11710584.69, 2101345.02],
        zoom: 6,
        projection: 'EPSG:3857',
      }),
    });

    setMap(mapObject);

    const handleMove = (evt: any) => {
      const [lon, lat] = toLonLat(evt.coordinate);
      setCoords([lon, lat]);
    };

    const handleZoom = () => {
      const z = mapObject.getView().getZoom();
      if (z !== undefined) setZoom(z);
    };

    mapObject.on('pointermove', handleMove);
    mapObject.on('moveend', handleZoom);
    handleZoom();

    return () => {
      mapObject.setTarget(undefined);
      mapObject.un('pointermove', handleMove);
      mapObject.un('moveend', handleZoom);
    };
  }, []);

  return (
    <MapContext.Provider value={map}>
      <div className="w-full h-screen relative" ref={mapRef}></div>

      {map && <GeoTinhLayer useMap={useMap} />}
      {map && <LocateButton map={map} />} {/* ✅ Thêm nút định vị */}

      {/* Hiển thị thông tin tọa độ và zoom ở góc dưới trái */}
      <div className="absolute bottom-2 left-2 bg-white bg-opacity-90 text-sm px-3 py-1 rounded shadow z-10">
        <div><strong>Zoom:</strong> {zoom.toFixed(2)}</div>
        <div>
          <strong>Kinh độ:</strong> {coords[0].toFixed(6)} | <strong>Vĩ độ:</strong> {coords[1].toFixed(6)}
        </div>
      </div>
    </MapContext.Provider>
  );
}

export default App;
