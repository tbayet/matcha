<template>
  <v-app>
    <v-toolbar v-if="$user.token.length" dark color="primary">
      <v-toolbar-side-icon></v-toolbar-side-icon>
      <v-toolbar-title class="white--text">
        <span>Matcha</span>
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn
        title="Browse"
        flat
        to="/browse"
      >Browse</v-btn>
      <v-btn
        title="Matches"
        flat
        href="https://github.com/vuetifyjs/vuetify/releases/latest"
      >
        <v-badge left overlap color="red">
          <v-icon left>star_half</v-icon>
          <span slot="badge">6</span>
        </v-badge>
        Matches
      </v-btn>
      <v-btn
        title="Chat"
        flat
        href="https://github.com/vuetifyjs/vuetify/releases/latest"
      >
        <v-badge left overlap color="red">
          <v-icon left>question_answer</v-icon>
          <span slot="badge">6</span>
        </v-badge>
        Chat
      </v-btn>
      <v-btn icon>
        <v-icon title="Disconnect" @click="disconnect">close</v-icon>
      </v-btn>
    </v-toolbar>

    <v-content>
      <router-view></router-view>
    </v-content>
  </v-app>
</template>

<script>

export default {
  name: 'App',
  methods: {
    disconnect() {
      document.cookie = "id="
      document.cookie = "token="
      this.$user = {
        id: '',
        token: ''
      }
      this.$router.push('/')
    }
  },
  data: () => ({
  })
}
</script>
