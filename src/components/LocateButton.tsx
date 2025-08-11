'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import Map from 'ol/Map'
import VectorSource from 'ol/source/Vector'
import VectorLayer from 'ol/layer/Vector'
import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import { Style, Circle as CircleStyle, Fill, Stroke } from 'ol/style'
import type { Geometry } from 'ol/geom'
import { fromLonLat } from 'ol/proj'

type LocateButtonProps = {
  map: Map | null
}

export default function LocateButton({ map }: LocateButtonProps) {
  const [locating, setLocating] = useState(false)
  const vectorSourceRef = useRef<VectorSource<Feature<Geometry>> | null>(null)
  const vectorLayerRef = useRef<VectorLayer<Feature<Geometry>> | null>(null)

  useEffect(() => {
    if (!map) return

    if (!vectorSourceRef.current) {
      vectorSourceRef.current = new VectorSource()
    }

    if (!vectorLayerRef.current) {
      vectorLayerRef.current = new VectorLayer({
        source: vectorSourceRef.current,
        style: new Style({
          image: new CircleStyle({
            radius: 8,
            fill: new Fill({ color: '#00f' }),
            stroke: new Stroke({ color: '#fff', width: 2 }),
          }),
        }),
        zIndex: 1000,
      })
      vectorLayerRef.current.set('name', 'current-location')
      map.addLayer(vectorLayerRef.current)
      console.log('[LocateButton] Layer current-location added to map')
    }

    return () => {
      if (vectorLayerRef.current && map) {
        map.removeLayer(vectorLayerRef.current)
        vectorLayerRef.current = null
        console.log('[LocateButton] Layer current-location removed from map')
      }
      if (vectorSourceRef.current) {
        vectorSourceRef.current.clear()
        vectorSourceRef.current = null
        console.log('[LocateButton] Vector source cleared')
      }
    }
  }, [map])

  const handleLocate = () => {
    if (!map) {
      console.warn('[LocateButton] map is null or undefined')
      alert('Không thể truy cập bản đồ.')
      return
    }

    if (!navigator.geolocation) {
      console.warn('[LocateButton] navigator.geolocation is undefined')
      alert('Trình duyệt không hỗ trợ định vị.')
      return
    }

    setLocating(true)
    console.log('[LocateButton] Bắt đầu lấy vị trí')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('[LocateButton] Vị trí lấy được:', position)
        const { latitude, longitude } = position.coords
        console.log(`[LocateButton] Tọa độ gốc: lat=${latitude}, lon=${longitude}`)

        const coords = fromLonLat([longitude, latitude])
        console.log('[LocateButton] Tọa độ chuyển sang EPSG:3857:', coords)

        map.getView().animate({ center: coords, zoom: 16, duration: 1000 })
        console.log('[LocateButton] Map zoom và center animation done')

        const pointFeature = new Feature(new Point(coords))
        if (vectorSourceRef.current) {
          vectorSourceRef.current.clear()
          vectorSourceRef.current.addFeature(pointFeature)
          console.log('[LocateButton] Marker feature updated on map')
        }

        setLocating(false)
      },
      (err) => {
        console.error('[LocateButton] Lỗi định vị:', err)
        switch (err.code) {
          case err.PERMISSION_DENIED:
            alert('Quyền định vị bị từ chối.')
            break
          case err.POSITION_UNAVAILABLE:
            alert('Không thể lấy vị trí hiện tại.')
            break
          case err.TIMEOUT:
            alert('Hết thời gian định vị. Vui lòng thử lại.')
            break
          default:
            alert('Lỗi định vị: ' + err.message)
        }
        setLocating(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  }

  return (
    <div className="absolute top-4 right-4 z-20">
      <Button onClick={handleLocate} disabled={locating}>
        {locating ? 'Đang định vị...' : 'Vị trí hiện tại'}
      </Button>
    </div>
  )
}
