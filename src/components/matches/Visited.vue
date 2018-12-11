<template>
  <v-list>
    <v-list-tile v-if="!visiters.length">
      Nobody visited you :'(
    </v-list-tile>
    <v-list-tile
      v-for="(visiter, index) in visiters"
      :key="index"
      :to="'/profil/' + visiter.idUser"
      :class="visiter.readed ? '' : 'bg_notif'"
      @click="readNotif(visiter.readed, visiter.id)"
    >
      <v-list-tile-title>
        {{visiter.nickname}}
      </v-list-tile-title>
    </v-list-tile>
  </v-list>
</template>

<script>
  import axios from 'axios'

  export default {
    data: () => ({
      visiters: [],
    }),
    mounted () {
      this.getVisiters()
    },
    methods: {
      readNotif (readed, idNotification) {
        if (!readed) {
          axios.post('api/users/readNotification', {
            userId: this.$user.id,
            userToken: this.$user.token,
            id: idNotification
          })
        }
      },
      getVisiters () {
        axios.get('api/users/visitedby', {
          params: {
            userId: this.$user.id,
            userToken: this.$user.token,
          }
        }).then(response => {
          if (response.data) {
            this.visiters = response.data
          }
        })
      }
    },
  }
</script>

<style>
  .bg_notif {
    background-color: 'blue lighten-5';
  }
</style>
