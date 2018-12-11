<template>
  <v-container fluid>
    <v-layout row justify-center>
      <v-flex xs11 justify-center>
        <v-btn large :disabled="!rights" icon @click="like()" :title="rights ? (liked ? (liking ? 'It\'s a Match !' : 'You\'ve been liked') : (liking ? 'Unlike' : 'Like')) : 'You must have at least one picture'">
          <v-icon :color="liked ? 'red' : 'black'" large>{{liking ? 'favorite' : 'favorite_border'}}</v-icon>
        </v-btn>
        <v-btn icon @click="block()" :title="blocked ? 'unblock' : 'block'">
          <v-icon :color="blocked ? 'red' : 'black'">block</v-icon>
        </v-btn>
        <v-btn :disabled="reported" icon @click="report()" :title="reported ? 'user has been reported' : 'report'">
          <v-icon>report_problem</v-icon>
        </v-btn>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
  import axios from 'axios'

  export default {
    props: ['id'],

    data: () => ({
      liked: false,
      liking: false,
      blocked: false,
      reported: false,
      rights: false,
    }),

    beforeMount () {
      this.requestInteracts()
      this.checkRights()
    },
    methods: {
      checkRights () {
        axios.get('api/users/likerights', {
          params: {
            userId: this.$user.id,
            userToken: this.$user.token,
          }
        }).then(response => {
          if (response.data)
            this.rights = true
          else
            this.rights = false
        })
      },
      report () {
        axios.post('api/users/report', {
          userId: this.$user.id,
          userToken: this.$user.token,
          id: this.id
        }).then(response => {
          if (response.data) {
            this.reported = true
          }
        })
      },
      block () {
        axios.post('api/users/block', {
          userId: this.$user.id,
          userToken: this.$user.token,
          id: this.id
        }).then(response => {
          if (response.data) {
            this.requestInteracts()
          }
        })
      },
      like () {
        axios.post('api/users/match', {
          userId: this.$user.id,
          userToken: this.$user.token,
          id: this.id
        }).then(response => {
          if (response.data) {
            this.requestInteracts()
          }
        })
      },
      requestInteracts () {
        axios.get('api/users/interacts', {
          params: {
            userId: this.$user.id,
            userToken: this.$user.token,
            id: this.id
          }
        }).then(response => {
          if (response.data) {
            this.liked = response.data.liked,
            this.liking = response.data.liking,
            this.blocked = response.data.blocked
          }
        })
      }
    },
  }
</script>

<style>

</style>
