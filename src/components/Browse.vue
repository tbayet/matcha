<template>
  <v-layout wrap>
    <v-flex xs6 md4 lg3 xl2 pa-2 v-for="profile in profiles" :key="profile.id">
      <v-card>
        <v-responsive>
          <v-img :src="null"></v-img>
        </v-responsive>

        <v-divider></v-divider>

        <v-card-text>
          <p>{{profile.nickname}}</p>
        </v-card-text>
      </v-card>
    </v-flex>
  </v-layout>
</template>

<script>
  import axios from 'axios'

  export default {
    beforeMount() {
      axios.post('api/users/profiles', {
        id: this.$user.id,
        token: this.$user.token,
        age: [18, 90],
        popularity: [0, 1000],
        distance: 500,
        tags: [1],
      }).then(response => {
        this.profiles = response.data
      })
    },
    data: () => ({
      profiles: []
    })
  }
</script>

<style>
</style>
