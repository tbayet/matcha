<template>
  <v-list>
    <v-list-tile v-if="!likes.length">
      Nobody likes you :'(
    </v-list-tile>
    <v-list-tile
      v-for="(like, index) in likes"
      :key="index"
      :to="'/profil/'+like.idUser"
      :class="like.readed ? '' : 'bg_notif'"
      @click="readNotif(like.readed, like.idNotification)"
    >
      <v-list-tile-title>
        {{like.nickname}}
      </v-list-tile-title>
    </v-list-tile>
  </v-list>
</template>

<script>
  import axios from 'axios'

  export default {
    data: () => ({
      likes: [],
    }),
    beforeMount () {
      this.getLikes()
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
      getLikes () {
        axios.get('api/users/likedby', {
          params: {
            userId: this.$user.id,
            userToken: this.$user.token,
          }
        }).then(response => {
          if (response.data) {
            this.likes = response.data
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
