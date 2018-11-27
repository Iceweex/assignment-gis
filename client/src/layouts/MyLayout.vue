<template>
  <q-layout view="lHh Lpr lFf">
    <q-layout-header>
      <q-toolbar
        color="primary"

        :inverted="$q.theme === 'ios'"
      >
        <q-btn
          flat
          dense
          round
          @click="leftDrawerOpen = !leftDrawerOpen"
          aria-label="Menu"
        >
          <q-icon name="menu" />
        </q-btn>

        <q-toolbar-title>
          PDT App
          <div slot="subtitle">Running on Quasar v{{ $q.version }}</div>
        </q-toolbar-title>
      </q-toolbar>
    </q-layout-header>

    <q-layout-drawer
      v-model="leftDrawerOpen"
      :content-class="$q.theme === 'mat' ? 'bg-grey-2' : null"
    >
      <q-list
        no-border
        link
        inset-delimiter
      >

      <q-list-header>Obce</q-list-header>

      <q-checkbox v-if="!showLess" style="width: 100%; padding: 0px 10px;" v-for="area in areas.slice(0, 15)" :key="area.properties.f1" v-model="checkArray" :label="area.properties.f2" @input="newData(area.properties.f1)"  color="primary" :val="area.properties.f1" />
      <q-checkbox v-if="showLess" style="width: 100%; padding: 0px 10px;" v-for="area in areas" :key="area.properties.f1" v-model="checkArray" :label="area.properties.f2" @input="newData(area.properties.f1)"  color="primary" :val="area.properties.f1" />
      <q-btn style="margin: 10px 10px;" v-if="showLess" @click="showLess = false">Show less</q-btn>
      <q-btn style="margin: 10px 10px;" v-if="!showLess" @click="showLess = true">Show more</q-btn>

        <q-list-header style="margin-top: 10px">Cyklotrasy</q-list-header>

   <q-card  class="q-ma-sm" v-for="(route, index) in sortedArray.slice(0, test)" :key="index">
      <div class="route-title" style="padding: 10px; font-size: 12px;" >
        <p style="margin: 0px">{{route.properties.f2}}</p>
        <div id="title-info">
         <small style="color: black; padding: 1px 5px; border-radius: 5px; background-color: darkgrey" >
        <q-icon name="directions_bike" /> {{route.length | nodecimals}}m
      </small>
        <q-btn @click="highlight(route.properties.f1)"  class="float-right" round color="amber" text-color="black" size="sm" icon="directions" />
         </div>
      </div>

      <q-list separator>
        <q-collapsible v-if="!route.restaurants" @show="getRestaurants(route.properties.f1, index)" icon="restaurant" :label="'Reštaurácie'">
          <div  v-for="(restaurant, index) in route.restaurants" :key="index">
            {{restaurant.name}}
            <small>
              <q-chip class="float-right" dense color="secondary" >
            {{restaurant.distance | nodecimals}}m
            </q-chip>
              </small>
          </div>
        </q-collapsible>
        <q-collapsible v-if="route.restaurants" icon="restaurant" :label="'Reštaurácie'">
          <div  v-for="(restaurant, index) in route.restaurants" :key="index">
            {{restaurant.name}}
            <small>
              <q-chip class="float-right" dense color="secondary" >
            {{restaurant.distance | nodecimals}}m
            </q-chip>
              </small>
          </div>
        </q-collapsible>
        <q-collapsible v-if="!route.towns"  @show="getTowns(route.properties.f1, index)" icon="map" :label="'Obce'">
          <div v-for="(town, index) in route.towns" :key="index">
            {{town.name}}
          </div>
        </q-collapsible>
        <q-collapsible v-if="route.towns" icon="map" :label="'Obce'">
          <div v-for="(town, index) in route.towns" :key="index">
            {{town.name}}
          </div>
        </q-collapsible>
      </q-list>
    </q-card>
      </q-list>
      <q-btn style="margin: 10px 10px;" @click="test += 15">Show more</q-btn>
    </q-layout-drawer>

    <q-page-container>
      <router-view ref="index"/>
    </q-page-container>
  </q-layout>
</template>

<script>
import { openURL } from 'quasar'

export default {
  name: 'MyLayout',
  data () {
    return {
      leftDrawerOpen: this.$q.platform.is.desktop,
      checkArray: [],
      showLess: false,
      test: 15
    }
  },
  computed: {

  areas: function(){
      return this.$store.state.polygons
  },

  sortedArray: function() {
    function compare(a, b) {
      if (a.distance < b.distance)
        return -1;
      if (a.distance > b.distance)
        return 1;
      return 0;
    }
    if(this.$store.state.routes){
    return this.$store.state.routes.sort(compare);
    }else{
      return [];
    }
  }
  },
  filters: {
  nodecimals: function (value) {
    return Math.ceil(value)
  }
},
  methods: {
    openURL,

    getRestaurants(id, index){
      console.log("clicked")
       this.$axios.post('/api/routedata', {
          id: id
      }).then((response) => {

          var self = this;
          console.log(response);
           var data = {
           index: index,
           value: response.data
          }

          this.$store.commit('updateRestaurants', data);
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

      getTowns(id, index){
      console.log("clicked")
       this.$axios.post('/api/towndata', {
          id: id
      }).then((response) => {

          var self = this;
          console.log(response);
           var data = {
           index: index,
            value: response.data
            }

          this.$store.commit('updateTowns', data);
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

    newData(id){
      this.$refs.index.newData(this.checkArray, id, this.checkArray.includes(id))
    },

    highlight(id){
      console.log("clicked: " , id);
      this.$refs.index.test(id)
    }
  }
}
</script>

<style>

#title-info{
  display: flex;
    align-items: center;
    justify-content: space-between;
}
</style>
