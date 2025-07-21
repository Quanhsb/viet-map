'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Map as OlMap, View } from 'ol'
import { fromLonLat } from 'ol/proj'
import { Feature } from 'ol'
import Point from 'ol/geom/Point'
import VectorSource from 'ol/source/Vector'
import VectorLayer from 'ol/layer/Vector'
import { Style, Circle as CircleStyle, Fill, Stroke } from 'ol/style'

type LocateButtonProps = {
  map: OlMap | null
}

export default function LocateButton({ map }: LocateButtonProps) {
  const [locating, setLocating] = useState(false)

  const handleLocate = () => {
    if (!map || !navigator.geolocation) {
      alert('Không thể truy cập định vị.')
      return
    }

    setLocating(true)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        const coords = fromLonLat([longitude, latitude])

        // Zoom vào vị trí
        map.getView().animate({ center: coords, zoom: 16, duration: 1000 })

        // Tạo marker
        const pointFeature = new Feature(new Point(coords))
        pointFeature.setStyle(
          new Style({
            image: new CircleStyle({
              radius: 8,
              fill: new Fill({ color: '#00f' }),
              stroke: new Stroke({ color: '#fff', width: 2 }),
            }),
          })
        )

        // Thêm vào layer mới
        const vectorSource = new VectorSource({ features: [pointFeature] })
        const vectorLayer = new VectorLayer({ source: vectorSource })
        vectorLayer.set('name', 'current-location')

        // Xóa layer cũ nếu có
        map.getLayers().forEach((layer) => {
          if (layer.get('name') === 'current-location') {
            map.removeLayer(layer)
          }
        })

        map.addLayer(vectorLayer)

        setLocating(false)
      },
      (err) => {
        alert('Không thể lấy vị trí. Kiểm tra quyền định vị.')
        console.error(err)
        setLocating(false)
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
