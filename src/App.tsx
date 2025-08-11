import { createContext, useContext, useRef, useEffect, useState } from 'react';
import Map from 'ol/Map';
import { MyMap } from './components/MyMap';
import { GeoTinhLayer } from './components/GeoTinhLayer';
import { GeoXaLayer } from './components/GeoXaLayer';
import LocateButton from './components/LocateButton';
import { toLonLat } from 'ol/proj';
import { SidebarXa } from './components/SideBarXa';
import 'ol/ol.css';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import Style from 'ol/style/Style';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import GeoJSON from 'ol/format/GeoJSON';
import Icon from 'ol/style/Icon';

import SearchBox from './components/Search';

export const MapContext = createContext<Map | null>(null);
export const useMap = () => useContext(MapContext);

function App() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<Map | null>(null);
  const [zoom, setZoom] = useState(0);
  const [coords, setCoords] = useState<[number, number]>([0, 0]);
  const [selectedTinh, setSelectedTinh] = useState<string | null>(null);
  const [elevation, setElevation] = useState<number | null>(null);
  const [isHoverEnabled, setIsHoverEnabled] = useState(true);

  const markerSourceRef = useRef(new VectorSource());
  const markerLayerRef = useRef(
    new VectorLayer({
      source: markerSourceRef.current
    })
  );

  const highlightSourceRef = useRef(new VectorSource());
  const highlightLayerRef = useRef(
    new VectorLayer({
      source: highlightSourceRef.current,
      style: new Style({
        stroke: new Stroke({ color: 'rgba(255,0,0,0.8)', width: 3 }),
        fill: new Fill({ color: 'rgba(255,0,0,0.3)' })
      })
    })
  );

  const isSearchZoomRef = useRef(false);

  useEffect(() => {
    if (!map) return;
    const layers = map.getLayers().getArray();
    if (!layers.includes(markerLayerRef.current)) {
      map.addLayer(markerLayerRef.current);
    }
    if (!layers.includes(highlightLayerRef.current)) {
      map.addLayer(highlightLayerRef.current);
    }
  }, [map]);

  useEffect(() => {
    if (!map) return;

    const handleMove = (evt: any) => {
      if (!evt.coordinate) return;
      const [lon, lat] = toLonLat(evt.coordinate);
      setCoords([lon, lat]);
    };

    const handleClick = async (evt: any) => {
      if (!evt.coordinate) return;
      const [lon, lat] = toLonLat(evt.coordinate);

      const featuresAtPixel = map.getFeaturesAtPixel(evt.pixel, {
        layerFilter: (layer) => layer === highlightLayerRef.current
      });
      if (!featuresAtPixel || featuresAtPixel.length === 0) {
        highlightSourceRef.current.clear();
      }

      markerSourceRef.current.clear();

      const marker = new Feature({
        geometry: new Point(evt.coordinate)
      });

      marker.setStyle(
        new Style({
          image: new Icon({
            src: '/marker.svg', 
            scale: 1.5,
            anchor: [0.5, 0.8], 
            anchorXUnits: 'fraction',
            anchorYUnits: 'fraction',
          })
        })
      );

      markerSourceRef.current.addFeature(marker);

      try {
        const response = await fetch(`https://gis.vn/api/elevation?lat=${lat.toFixed(6)}&lng=${lon.toFixed(6)}`);
        const data = await response.json();
        if (data.success) {
          setElevation(data.data.elevation);
        } else {
          setElevation(null);
        }
      } catch (error) {
        console.error("Lỗi khi lấy độ cao:", error);
        setElevation(null);
      }
    };

    const handleZoom = () => {
      const view = map.getView();
      const z = view.getZoom();
      if (z !== undefined) setZoom(z);
      if (isSearchZoomRef.current) {
        isSearchZoomRef.current = false;
      }
    };

    if (isHoverEnabled) {
      map.on('pointermove', handleMove);
    } else {
      map.un('pointermove', handleMove);
    }

    map.on('click', handleClick);
    map.on('moveend', handleZoom);

    handleZoom();

    return () => {
      map.un('pointermove', handleMove);
      map.un('click', handleClick);
      map.un('moveend', handleZoom);
    };
  }, [map, isHoverEnabled]);

  const handleSelectSearch = async (type: "tinh" | "xa", name: string) => {
    if (!map) return;

    try {
      const format = new GeoJSON();
      let url = "";
      if (type === "tinh") {
        url = `http://127.0.0.1:5000/api/infoprovince/provinces/${encodeURIComponent(name)}`;
      } else {
        const [tenXa, tenTinh] = name.split(',').map(s => s.trim());
        url = `http://127.0.0.1:5000/api/infocommune/${encodeURIComponent(tenTinh)}/${encodeURIComponent(tenXa)}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      if (!data) return;

      let features: any[] = [];
      if (data.type === "FeatureCollection" && Array.isArray(data.features)) {
        features = format.readFeatures(data, { featureProjection: "EPSG:3857" });
      } else if (data.type === "Feature" && data.geometry) {
        const f = format.readFeature(data, { featureProjection: "EPSG:3857" });
        if (f) features.push(f);
      }

      if (features.length > 0) {
        let extent = features[0].getGeometry()?.getExtent();
        for (let i = 1; i < features.length; i++) {
          const geom = features[i].getGeometry();
          if (geom && extent) {
            extent = [
              Math.min(extent[0], geom.getExtent()[0]),
              Math.min(extent[1], geom.getExtent()[1]),
              Math.max(extent[2], geom.getExtent()[2]),
              Math.max(extent[3], geom.getExtent()[3]),
            ];
          }
        }
        if (extent) {
          isSearchZoomRef.current = true;
          map.getView().fit(extent, { duration: 1000, padding: [60, 60, 60, 60] });
        }

        highlightSourceRef.current.clear();
        features.forEach(f => highlightSourceRef.current.addFeature(f));
      }

      setSelectedTinh(null);

    } catch (error) {
      console.error("Lỗi khi xử lý tìm kiếm:", error);
    }
  };

  return (
    <MapContext.Provider value={map}>
      <div className="absolute top-2 left-10 z-30">
        <SearchBox onSelectResult={handleSelectSearch} />
      </div>

      <MyMap mapRef={mapRef} onMapReady={setMap} />
      {map && <GeoTinhLayer useMap={useMap} onTinhSelect={setSelectedTinh} isHoverEnabled={isHoverEnabled} />}
      {map && <GeoXaLayer useMap={useMap} />}
      {map && <LocateButton map={map} />}
      <SidebarXa selectedTinh={selectedTinh} />

      <div className="absolute bottom-2 left-2 bg-white bg-opacity-90 text-sm px-3 py-1 rounded shadow z-10">
        <div><strong>Zoom:</strong> {zoom.toFixed(2)}</div>
        <div>
          <strong>Kinh độ:</strong> {coords[0].toFixed(6)} | <strong>Vĩ độ:</strong> {coords[1].toFixed(6)}
        </div>
        <div>
          <strong>Độ cao:</strong> {elevation !== null ? `${elevation} m` : 'Đang tải'}
        </div>
      </div>

      <div className="absolute bottom-20 left-2 bg-white p-3 shadow-md rounded flex items-center space-x-2 z-20">
        <Switch
          id="hover-toggle"
          checked={isHoverEnabled}
          onCheckedChange={setIsHoverEnabled}
        />
        <Label htmlFor="hover-toggle">Bật hiệu ứng màu</Label>
      </div>
    </MapContext.Provider>
  );
}

export default App;
