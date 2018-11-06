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
  var self = this;
    this.map.on('load', function () {
       self.loadData(),
       self.loadPoints(),
       self.loadPolygons()
    })
  },
  methods: {
    loadData () {
      this.$axios.get('/api/data')
        .then((response) => {
          console.log(response.data);
          this.data = response.data;
          this.$store.commit('update',response.data.features);
          this.map.addSource('tom', {
            type: 'geojson',
            data: this.data
          })
          this.map.addLayer({
            'id': 'some id',
            type: 'line',
            source: 'tom'
          })

        })
        .catch(() => {
          this.$q.notify({
            color: 'negative',
            position: 'top',
            message: 'Loading failed',
            icon: 'report_problem'
          })
        })
    },

    loadPoints () {
      this.$axios.get('/api/points')
        .then((response) => {
          this.data = response.data;
          console.log(this.data);
          this.$store.commit('updatePoints',response.data.features);
          this.map.addSource('points', {
            type: 'geojson',
            data: this.data
          })
          this.map.addLayer({
            'id': 'points',
            type: 'symbol',
            source: 'points',
        "layout": {
            "icon-image": "restaurant-15",
            "text-field": "{f2}",
            "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
            "text-offset": [0, 0.6],
            "text-anchor": "top"
        }
          })

        })
        .catch(() => {
          this.$q.notify({
            color: 'negative',
            position: 'top',
            message: 'Loading failed',
            icon: 'report_problem'
          })
        })
    },

    loadPolygons () {
      this.$axios.get('/api/polygons')
        .then((response) => {
          this.data = response.data;
          console.log(this.data);
          this.$store.commit('updatePolygons',response.data.features);
          this.map.addSource('polygons', {
            type: 'geojson',
            data: this.data
          })
          this.map.addLayer({
            'id': 'polygons',
            type: 'fill',
            source: 'polygons',
            'paint': {
            'fill-color': '#088',
            'fill-opacity': 0.3
            }
          })

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
