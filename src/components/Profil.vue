<template>
  <v-layout wrap>
    <v-flex xs12 sm8 pa-2>
      <v-card>
          <pictures :owner="owner" :id="id ? id : $user.id"></pictures>
          <account :owner="owner" :id="id ? id : $user.id"></account>
        <v-divider></v-divider>

        <v-card-text>
          <tags :owner="owner" :id="id ? id : $user.id"></tags>
        </v-card-text>
      </v-card>
    </v-flex>

    <v-flex xs12 sm4 pa-2>
      <interact v-if="!owner" :id="id"></interact>
      <bio :owner="owner" :id="id ? id : $user.id"></bio>
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
    props: ['id'],
    beforeMount() {
      if (this.id) {
        if (this.id == this.$user.id)
          this.owner = true
      } else {
        this.owner = true
      }
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
