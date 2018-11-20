<template>
  <v-card flat>
    <v-toolbar
      color="primary"
      dark
      extended
      flat
    >
      <v-spacer></v-spacer>
      <v-toolbar-title class="white--text">
        <span>Matcha</span>
      </v-toolbar-title>
      <v-spacer></v-spacer>
    </v-toolbar>

    <v-layout row pb-2>
      <v-flex xs8 offset-xs2>
        <v-card class="card--flex-toolbar">
          <v-toolbar card prominent tabs>
            <v-tabs
              v-model="tabs"
              centered
              grow
            >
              <v-tab>
                Connexion
              </v-tab>
              <v-tab>
                Registration
              </v-tab>
            </v-tabs>
          </v-toolbar>

          <v-divider></v-divider>

          <v-card-text style="min-height: 300px;">
            <connect v-if="tabs == 0"></connect>
            <register v-if="tabs == 1"></register>
          </v-card-text>
        </v-card>
      </v-flex>
    </v-layout>
  </v-card>
</template>

<script>
  import Connect from './Connect'
  import Register from './Register'

  export default {
    components: {
      Connect,
      Register
    },
    data: () => ({
      tabs: 0
    })
  }
</script>

<style>
  .card--flex-toolbar {
    margin-top: -64px;
  }
</style>
