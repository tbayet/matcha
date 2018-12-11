<template>
  <v-layout row pb-2>
    <v-flex xs8 offset-xs2>
      <v-toolbar card prominent tabs>
        <v-tabs
          v-model="tabs"
          centered
          grow
        >
          <v-tab @click="$router.replace('/matches/match')">Matches</v-tab>
          <v-tab @click="$router.replace('/matches/likes')">Who likes you</v-tab>
          <v-tab @click="$router.replace('/matches/visited')">Visited you</v-tab>
        </v-tabs>
      </v-toolbar>
      <v-divider></v-divider>
      <match v-if="tabs == 0"></match>
      <likes v-if="tabs == 1"></likes>
      <visited v-if="tabs == 2"></visited>
    </v-flex>
  </v-layout>
</template>

<script>
  import Match from './matches/Match.vue'
  import Visited from './matches/Visited.vue'
  import Likes from './matches/Likes.vue'

  import axios from "axios"
  export default {
    props: ["onglet"],
    beforeMount() {
      if (this.onglet && this.onglet == "visited") {
        this.tabs = 2
      } else if (this.onglet && this.onglet == "likes") {
        this.tabs = 1
      } else if (this.onglet && this.onglet != "match") {
        this.$router.replace("/matches")
      }
    },
    components: {
      'match' : Match,
      'visited' : Visited,
      'likes' : Likes
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
