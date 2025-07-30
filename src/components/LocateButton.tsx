'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Map as OlMap } from 'ol'
import { fromLonLat } from 'ol/proj'
import { Feature } from 'ol'
import Point from 'ol/geom/Point'
import VectorSource from 'ol/source/Vector'
import VectorLayer from 'ol/layer/Vector'
import { Style, Circle as CircleStyle, Fill, Stroke } from 'ol/style'
import type { Geometry } from 'ol/geom'

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

        // zoom vào vị trí
        map.getView().animate({ center: coords, zoom: 16, duration: 1000 })

        // tạo marker mới
        const pointFeature = new Feature<Point>(new Point(coords))
        pointFeature.setStyle(
          new Style({
            image: new CircleStyle({
              radius: 8,
              fill: new Fill({ color: '#00f' }),
              stroke: new Stroke({ color: '#fff', width: 2 }),
            }),
          })
        )

        // xóa layer cũ nếu có
        const oldLayer = map
          .getLayers()
          .getArray()
          .find((layer) => layer.get('name') === 'current-location')
        if (oldLayer) {
          map.removeLayer(oldLayer)
        }

        // tạo vector source + layer
        const vectorSource = new VectorSource<Feature<Geometry>>({
          features: [pointFeature],
        })

        const vectorLayer = new VectorLayer({
          source: vectorSource,
        })

        vectorLayer.set('name', 'current-location')

        // thêm layer mới
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
