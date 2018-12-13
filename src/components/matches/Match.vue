<template>
  <v-list>
    <v-list-tile v-if="!matches.length">
      Nobody liked you back :'(
    </v-list-tile>
    <v-list-tile
      v-for="(match, index) in matches"
      :key="index"
      :to="'/profil/' + match.idLiked"
      :class="match.readed ? '' : 'bg_notif'"
      @click="readNotif(match.readed, match.idNotification)"
    >
      <v-list-tile-title>
        {{match.nickname}}
      </v-list-tile-title>
    </v-list-tile>
  </v-list>
</template>

<script>
  import axios from 'axios'

  export default {
    data: () => ({
      matches: [],
    }),
    beforeMount () {
      this.getMatches()
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
      getMatches () {
        axios.get('api/users/matches', {
          params: {
            userId: this.$user.id,
            userToken: this.$user.token,
          }
        }).then(response => {
          if (response.data) {
            this.matches = response.data
          }
        })
      }
    },
  }
</script>

<style>
  .bg_notif {
    background-color: '#BBDEFB';
  }
</style>
