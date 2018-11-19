<template>
  <q-page id="map">
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

    this.geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      bbox: [17.00674, 48.04816, 18.10674, 49.14816]
   });

  var self = this;
   this.geocoder.on('result', function(ev) {
    var searchResult = ev.result.geometry;
    self.map.getSource('single-point').setData(searchResult);
    var options = { units: 'kilometers' };
    self.$store.state.routes.forEach(function(store, index) {
    var data = {
      index: index,
      value: turf.distance(searchResult, store.geometry.coordinates[0], options)
    }
       self.$store.commit('distance', data);
    });
  });

    this.map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v10',
      minzoom: 1.3,
      center: [17.10674, 48.14816], // Bratislava
      zoom: 10
    })
    this.map.addControl(new mapboxgl.NavigationControl())
     this.map.addControl(this.geocoder, 'top-left');
    this.map.addControl(new mapboxgl.GeolocateControl({
    positionOptions: {
        enableHighAccuracy: true
    },
    trackUserLocation: true
    }))
  var self = this;
    this.map.on('load', function () {
       self.loadData(),
       self.loadPoints(),
       self.loadPolygons(),

      self.map.addSource('single-point', {
  type: 'geojson',
  data: {
    type: 'FeatureCollection',
    features: [] // Notice that initially there are no features
  }
});

self.map.addLayer({
  id: 'point',
  source: 'single-point',
  type: 'circle',
  paint: {
    'circle-radius': 10,
    'circle-color': '#007cbf',
    'circle-stroke-width': 3,
    'circle-stroke-color': '#fff'
  }
});

    })
  },
  methods: {
    test(id){
       this.map.setFeatureState({source: 'routes', id: id}, { hover: true});
       this.$axios.post('/api/touchdata', {
          id: id
      }).then((response) => {

          var self = this;
          response.data.forEach(function(singleElement){
              console.log(singleElement.id);
              self.map.setFeatureState({source: 'routes', id: singleElement.id}, { touch: true});
          });

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
    loadData () {
      this.$axios.get('/api/data')
        .then((response) => {
          console.log(response.data);
          this.data = response.data;
          this.$store.commit('update',response.data.features);
          this.map.addSource('routes', {
            type: 'geojson',
            data: this.data
          })
          this.map.addLayer({
            'id': 'routes',
            type: 'line',
            source: 'routes',
            "paint": {
            "line-color": ["case",
            ["boolean", ["feature-state", "touch"], false],
            "red",
            ["boolean", ["feature-state", "hover"], false],
            "#D0FF14",
            "#000000"],
            "line-width": ["case",
            ["boolean", ["feature-state", "hover"], false],
            3,
            ["boolean", ["feature-state", "touch"], false],
            3,
            1 ]
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

    newData(towns){
      console.log('towns:', towns)
         if(towns.length == 0){
       this.$axios.get('/api/data').then((response) => {
          this.data = response.data;
          this.map.removeLayer('routes');
          this.map.removeSource('routes');
          this.$store.commit('update',response.data.features);
          this.map.addSource('routes', {
            type: 'geojson',
            data: this.data
          })
          this.map.addLayer({
            'id': 'routes',
            type: 'line',
            source: 'routes',
            "paint": {
            "line-color": ["case",
                ["boolean", ["feature-state", "hover"], false],
                "green",
                "#000000"
              ],
            "line-width": ["case",
                ["boolean", ["feature-state", "hover"], false],
                3,
                1
              ]
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


         }else{

       this.$axios.post('/api/updatedata', {
          data: towns
      }).then((response) => {
          this.data = response.data;
          this.map.removeLayer('routes');
          this.map.removeSource('routes');
          this.$store.commit('update',response.data.features);
          this.map.addSource('routes', {
            type: 'geojson',
            data: this.data
          })
          this.map.addLayer({
            'id': 'routes',
            type: 'line',
            source: 'routes',
            "paint": {
            "line-color": ["case",
                ["boolean", ["feature-state", "hover"], false],
                "green",
                "#000000"
              ],
            "line-width": ["case",
                ["boolean", ["feature-state", "hover"], false],
                3,
                1
              ]
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
