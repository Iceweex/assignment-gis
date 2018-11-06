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
        <q-list-header>Cyklotrasy</q-list-header>

   <q-card  class="q-ma-sm" v-for="route in this.$store.state.routes" :key="route.properties.f1">
      <p class="route-title" style="padding: 15px 10px 15px 10px; font-size: 12px;" >
        {{route.properties.f3}}
      </p>
      <div style="margin-top: 5px; padding: 0px 15px;">
      <small style="padding: 1px 5px; border-radius: 5px; background-color: darkgrey" >
        <q-icon name="directions_bike" /> {{route.length | nodecimals}}m
      </small>

      </div>

      <q-list separator>
        <q-collapsible icon="location_city" label="Pamiatky">
          <div>
            Lorem ipsum dolor sit amet...
          </div>
        </q-collapsible>

        <q-collapsible icon="restaurant" :label="'Reštaurácie (' + route.restaurants.length + ')'">
          <div v-for="restaurant in route.restaurants" :key="restaurant">
            {{restaurant}}
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
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import { openURL } from 'quasar'

export default {
  name: 'MyLayout',
  data () {
    return {
      leftDrawerOpen: this.$q.platform.is.desktop
    }
  },
  filters: {
  nodecimals: function (value) {
    return Math.ceil(value)
  }
},
  methods: {
    openURL
  }
}
</script>

<style>
</style>
