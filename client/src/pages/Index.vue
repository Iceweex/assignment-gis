<template>
  <q-page  id="map">
  </q-page>
</template>

<style>

</style>

<script>
var mapboxgl = require('mapbox-gl/dist/mapbox-gl.js')
import 'mapbox-gl/dist/mapbox-gl.css'

export default {
  name: 'PageIndex',
  mounted () {
    mapboxgl.accessToken = 'pk.eyJ1IjoiaWNld2VleCIsImEiOiJjam1sNWk1YTQwNGg4M2xvYXJvZ2V2bDQxIn0.EAtIQ0IuhxAg1PqyqpdXng'
    this.map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v10',
      minzoom: 1.3,
      center: [17.10674, 48.14816], // Bratislava
      zoom: 10
    })
    this.map.addControl(new mapboxgl.NavigationControl())
  var there = this;
    this.map.on('load', function () {
      this.addLayer({
        "id": "points",
        "type": "symbol",
        "source": {
            "type": "geojson",
            "data": {
                "type": "FeatureCollection",
                "features": [{
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [-77.03238901390978, 38.913188059745586]
                    },
                    "properties": {
                        "title": "Mapbox DC",
                        "icon": "monument"
                    }
                }, {
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [-122.414, 37.776]
                    },
                    "properties": {
                        "title": "Mapbox DC",
                        "icon": "monument"
                    }
                }]
            }
        },
        "layout": {
            "icon-image": "marker",
            "text-field": "{title}",
            "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
            "text-offset": [0, 0.6],
            "text-anchor": "top"
        }
    });
       there.loadData()
    })
  },
  methods: {
    loadData () {
      this.$axios.get('/api/data')
        .then((response) => {
          this.data = response.data
          this.map.addSource('tom', {
            type: 'geojson',
            data: this.data
          })
          this.map.addLayer({
            'id': 'some id',
            type: 'symbol',
            source: 'tom',
        "layout": {
            "icon-image": "marker-15",
            "text-field": "TEST",
            "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
            "text-offset": [0, 0.6],
            "text-anchor": "top"
        }
          })
          this.map.getSource('tom')
        
        })
        .catch(() => {
          this.$q.notify({
            color: 'negative',
            position: 'top',
            message: 'Loading failed',
            icon: 'report_problem'
          })
        })
    }
  }
}
</script>
