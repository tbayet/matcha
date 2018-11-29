<template>
  <v-layout wrap>
    <v-flex xs12 sm8 pa-2>
      <v-card>
          <pictures :owner="owner" :id="id"></pictures>
          <account :owner="owner" :id="id"></account>
        <v-divider></v-divider>

        <v-card-text>
          <tags :owner="owner" :id="id"></tags>
        </v-card-text>
      </v-card>
    </v-flex>

    <v-flex xs12 sm4 pa-2>
      <interact v-if="!owner" :id="id"></interact>
      <bio :owner="owner" :id="id"></bio>
    </v-flex>
  </v-layout>
</template>

<script>
  import axios from 'axios'
  import Tags from './profil/Tags.vue'
  import Bio from './profil/Bio.vue'
  import Account from './profil/Account.vue'
  import Pictures from './profil/Pictures.vue'
  import Interact from './profil/Interact.vue'

  export default {
    props: ['nickname'],
    beforeMount() {
      if (this.nickname) {
        axios.get('api/id/', {
          params: this.nickname
        }).then(function (response) {
          if (response.data) {
            if (response.data == this.$user.id)
              this.owner = true
            this.id = response.data
          }
        })
      } else {
        this.owner = true
        this.id = this.$user.id
      }
    },
    methods: {
    },
    data: () => ({
      owner: false
    }),
    components: {
      'tags': Tags,
      'bio': Bio,
      'account': Account,
      'pictures': Pictures,
      'interact': Interact
    }
  }
</script>

<style>
</style>
