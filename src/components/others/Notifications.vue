<template>
  <v-list>
    <v-list-tile
      v-for="(notif, index) in notifications"
      :key="index"
      :to="routeTo(notif.type, notif.idNotifier)"
      :class="notif.readed ? '' : 'bg_notif'"
      @click="readNotif(notif.readed, notif.id)"
    >
      <v-list-tile-title>
        {{getTerm(notif.type)}}
      </v-list-tile-title>
      <v-list-tile-action>
        <v-btn icon @click="removeNotification(notif.id, $event)">
          <v-icon>close</v-icon>
        </v-btn>
      </v-list-tile-action>
    </v-list-tile>
  </v-list>
</template>

<script>
  import axios from 'axios'

  export default {
    props: ['preload_notifications'],
    watch: {
      preload_notifications (newValue, oldValue) {
        this.notifications = newValue
      }
    },
    data: () => ({
      notifications: [],
    }),

    beforeMount () {
      if (this.preload_notifications)
        this.notifications = this.preload_notifications
    },
    methods: {
      readNotif (readed, id) {
        if (!readed) {
          axios.post('api/users/readNotification', {
            userId: this.$user.id,
            userToken: this.$user.token,
            id: id
          })
        }
      },
      routeTo (type, idNotifier) {
        switch(type) {
          case 1: return ("/matches/likes")
          case 2: return ("/matches/visited")
          case 3: return ("/chat")
          case 4: return ("/matches/match")
          case 5: return ("/profil/" + idNotifier)
        }
      },
      getTerm (type) {
        switch(type) {
          case 1: return "Somebody liked you !"
          case 2: return "Somebody visited your profile !"
          case 3: return "You got a new message !"
          case 4: return "You have a new match !"
          case 5: return "A match have been broke :\'("
        }
      },
      removeNotification (id, e) {
        if (e) e.preventDefault()
        axios.post('api/users/deleteNotification', {
          userId: this.$user.id,
          userToken: this.$user.token,
          id: id
        }).then(response => {
          if (response.data) {
            this.getNotifications()
          }
        })
      },
      getNotifications () {
        axios.get('api/users/notifications', {
          params: {
            userId: this.$user.id,
            userToken: this.$user.token,
          }
        }).then(response => {
          if (response.data) {
            this.notifications = response.data
          }
        })
      }
    },
  }
</script>

<style scoped>
  .bg_notif {
    background-color: #BBDEFB;
  }
</style>
