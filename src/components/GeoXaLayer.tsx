import { useEffect } from 'react';
import { Vector as VectorLayer } from 'ol/layer';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import { Stroke, Style } from 'ol/style';
import Feature from 'ol/Feature';
import Geometry from 'ol/geom/Geometry';
import { Map as OLMap } from 'ol';

export const GeoXaLayer = ({ useMap }: { useMap: () => OLMap | null }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const vectorSource = new VectorSource<Feature<Geometry>>({
      url: '/data/DiaPhan_Xa_2025.json',
      format: new GeoJSON(),
    });

    const layer = new VectorLayer({
      source: vectorSource,
      style: new Style({
        stroke: new Stroke({
          color: '#FF00FF',
          width: 1.2,
        }),
      }),
    });

    const handleViewChange = () => {
      const zoom = map.getView().getZoom();
      if (typeof zoom !== 'number') return;

      if (zoom > 10) {
        if (!map.getLayers().getArray().includes(layer)) {
          map.addLayer(layer);
        }
      } else {
        map.removeLayer(layer);
      }
    };

    map.getView().on('change:resolution', handleViewChange);
    handleViewChange();

    return () => {
      map.removeLayer(layer);
      map.getView().un('change:resolution', handleViewChange);
    };
  }, [map]);

  return null;
};
