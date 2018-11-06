import Vue from 'vue'
import Vuex from 'vuex'

import example from './module-example'

Vue.use(Vuex)

/*
 * If not building with SSR mode, you can
 * directly export the Store instantiation
 */

export default function (/* { ssrContext } */) {
  const Store = new Vuex.Store({
    modules: {
      example
    },
    state: {
      routes_count: null,
      routes: [],
      points: [],
      polygons: []
    },
    mutations: {
      update (state, data) {
        // mutate state
        state.routes = data;
      },
      updatePoints (state, data) {
        // mutate state
        state.points = data;
      },
      updatePolygons (state, data) {
        // mutate state
        state.polygons = data;
      },
      updateCount (state, data) {
        // mutate state
        state.routes_count = data;
      }
    }
  })

  return Store
}
