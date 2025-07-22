import { createContext, useContext, useRef, useEffect, useState } from 'react';
import Map from 'ol/Map';
import { MyMap } from './components/MyMap';
import { GeoTinhLayer } from './components/GeoTinhLayer';
import { GeoXaLayer } from './components/GeoXaLayer';
import LocateButton from './components/LocateButton';
import { toLonLat } from 'ol/proj';
import { SidebarXa } from './components/SideBarXa';
import 'ol/ol.css';

export const MapContext = createContext<Map | null>(null);
export const useMap = () => useContext(MapContext);

function App() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<Map | null>(null);
  const [zoom, setZoom] = useState(0);
  const [coords, setCoords] = useState<[number, number]>([0, 0]);
  const [selectedTinh, setSelectedTinh] = useState<string | null>(null);

  useEffect(() => {
    if (!map) return;
    const view = map.getView();

    const handleMove = (evt: any) => {
      const [lon, lat] = toLonLat(evt.coordinate);
      setCoords([lon, lat]);
    };

    const handleZoom = () => {
      const z = view.getZoom();
      if (z !== undefined) setZoom(z);
    };

    map.on('pointermove', handleMove);
    map.on('moveend', handleZoom);
    handleZoom();

    return () => {
      map.un('pointermove', handleMove);
      map.un('moveend', handleZoom);
    };
  }, [map]);

  return (
    <MapContext.Provider value={map}>
      <MyMap mapRef={mapRef} onMapReady={setMap} />
      {map && <GeoTinhLayer useMap={useMap} onTinhSelect={setSelectedTinh} />}
      {map && <GeoXaLayer useMap={useMap} />}
      {map && <LocateButton map={map} />}
      <SidebarXa selectedTinh={selectedTinh} />
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
