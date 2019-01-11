<template>
  <v-app>
    <v-navigation-drawer
      v-model="drawer"
      absolute
      dark
      temporary
    >
      <v-list class="pt-0" dense>
        <v-list-tile to="/browse"><v-list-tile-content><v-list-tile-title> Browse </v-list-tile-title></v-list-tile-content></v-list-tile>
        <v-list-tile to="/matches"><v-list-tile-content><v-list-tile-title> Matches </v-list-tile-title></v-list-tile-content></v-list-tile>
        <v-list-tile to="/chat"><v-list-tile-content><v-list-tile-title> Chat </v-list-tile-title></v-list-tile-content></v-list-tile>
        <v-list-tile :to="'/profil/'+ $user.id"><v-list-tile-content><v-list-tile-title> Profile </v-list-tile-title></v-list-tile-content></v-list-tile>
      </v-list>
    </v-navigation-drawer>
    <v-toolbar v-if="$user.token.length" dark color="primary">
      <v-btn
        v-if="$vuetify.breakpoint.name == 'xs'"
        flat
        dark
        @click.stop="drawer = !drawer"
      >
        Menu
      </v-btn>
      <v-toolbar-title class="white--text">
        <span>Matcha</span>
      </v-toolbar-title>
      <v-spacer></v-spacer>
      
      <v-btn
        v-if="$vuetify.breakpoint.name != 'xs'"
        title="Browse"
        flat
        to="/browse"
      >
        <v-icon left>search</v-icon>
        <span class="hidden-sm-and-down">Browse</span>
      </v-btn>
      <v-spacer></v-spacer>
      <v-btn
        v-if="$vuetify.breakpoint.name != 'xs'"
        title="Matches"
        flat
        to="/matches"
      >
        <v-badge left overlap color="red">
          <v-icon left>star_half</v-icon>
          <span v-if="newMatches" slot="badge">!</span>
        </v-badge>
        <span class="hidden-sm-and-down">Matches</span>
      </v-btn>
      <v-btn
        v-if="$vuetify.breakpoint.name != 'xs'"
        title="Chat"
        flat
        to="/chat"
      >
        <v-badge left overlap color="red">
          <v-icon left>question_answer</v-icon>
          <span v-if="newChat" slot="badge">!</span>
        </v-badge>
        <span class="hidden-sm-and-down">Chat</span>
      </v-btn>
      <v-menu
        offset-y
        min-width="300"
        :close-on-content-click="false"
      >
        <v-btn
          icon
          title="Notifications"
          flat
          slot="activator"
        >
          <v-badge left overlap color="red">
            <v-icon>notifications</v-icon>
            <span v-if="nbNewNotifications" slot="badge">{{nbNewNotifications}}</span>
          </v-badge>
        </v-btn>
        <notifications v-if="nbNotifications" :preload_notifications="notifications"></notifications>
      </v-menu>
      <v-btn
        v-if="$vuetify.breakpoint.name != 'xs'"
        title="Profile"
        flat
        :to="'/profil/'+ $user.id"
      >
        <v-icon left>person</v-icon>
        <span class="hidden-sm-and-down">Profile</span>
      </v-btn>
      <v-btn icon>
        <v-icon title="Disconnect" @click="disconnect">close</v-icon>
      </v-btn>
    </v-toolbar>

    <v-content>
      <router-view :key="$route.name + ($route.params.id || $route.params.onglet || $route.query.id || '')"></router-view>
    </v-content>
  </v-app>
</template>

<script>
import axios from 'axios'
import Notifications from './components/others/Notifications.vue'

export default {
  name: 'App',
  mounted () {
    setInterval(() => {
      if (this.$user.token.length && this.$user.id)
        this.getNotifications()
    }, 3000)
  },
  methods: {
    disconnect () {
      document.cookie = "id="
      document.cookie = "token="
      this.$user = {
        id: '',
        token: ''
      }
      this.$router.push('/')
    },
    getNotifications () {
      axios.get('api/users/notifications', {
        params: {
          userId: this.$user.id,
          userToken: this.$user.token,
        }
      }).then(response => {
        if (response.data) {
          this.nbNotifications = 0
          this.nbNewNotifications = 0
          this.newMatches = false
          this.newChat = false
          this.notifications = response.data.map(elem => {
            if (!this.newMatches && !elem.readed && elem.type != 3)
              this.newMatches = true
            if (!this.newChat && !elem.readed && elem.type == 3)
              this.newChat = true
            if (!elem.readed)
              this.nbNewNotifications++
            this.nbNotifications++
            return elem
          })
        }
      })
    }
  },
  data: () => ({
    drawer: false,
    nbNotifications : 0,
    nbNewNotifications: 0,
    notifications : [],
    newMatches: false,
    newChat: false,
  }),
  components: {
    'notifications': Notifications,
  }
}
</script>
