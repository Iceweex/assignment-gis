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

      <q-checkbox style="width: 100%; padding: 0px 10px;" v-for="area in areas" :key="area.properties.f1" v-model="checkArray" :label="area.properties.f2" @input="newData()" color="primary" :val="area.properties.f1" />

        <q-list-header style="margin-top: 10px">Cyklotrasy</q-list-header>

   <q-card  class="q-ma-sm" v-for="route in sortedArray" :key="route.geometry.id">
      <div class="route-title" style="padding: 10px; font-size: 12px;" >
        <p style="margin: 0px">{{route.properties.f3}}</p>
        <div id="title-info">
         <small style="color: black; padding: 1px 5px; border-radius: 5px; background-color: darkgrey" >
        <q-icon name="directions_bike" /> {{route.length | nodecimals}}m
      </small>
        <q-btn @click="highlight(route.id)"  class="float-right" round color="amber" text-color="black" size="sm" icon="directions" />
         </div>
      </div>

      <q-list separator>
        <q-collapsible icon="restaurant" :label="'Reštaurácie (' + route.restaurants.length + ')'">
          <div v-for="(restaurant, index) in route.restaurants" :key="index">
            {{restaurant.name}}
            <small>
              <q-chip class="float-right" dense color="secondary" >
            {{restaurant.distance | nodecimals}}m
            </q-chip>
              </small>
          </div>
        </q-collapsible>
        <q-collapsible icon="map" :label="'Obce (' + route.towns.length + ')'">
          <div v-for="town in route.towns" :key="town">
            {{town}}
          </div>
        </q-collapsible>
      </q-list>
    </q-card>
      </q-list>
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
      checkArray: []
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

    return this.$store.state.routes.sort(compare);
  }
  },
  filters: {
  nodecimals: function (value) {
    return Math.ceil(value)
  }
},
  methods: {
    openURL,

    newData(){
      this.$refs.index.newData(this.checkArray)
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
