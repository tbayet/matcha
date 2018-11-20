<template>
  <v-card>
    <v-card-title>
      <h3>Bio</h3>
      <v-spacer></v-spacer>
      <v-btn v-if="owner" icon>
        <v-icon @click="edit">{{ editing ? "done" : "create" }}</v-icon>
      </v-btn>
    </v-card-title>
    <v-divider></v-divider>
    <v-card-text>
      <div v-if="!editing"><p>{{bio}}</p></div>
      <v-textarea
        v-if="editing"
        outline
        v-model="bio"
      >
      </v-textarea>
    </v-card-text>
  </v-card>
</template>

<script>
  import axios from 'axios'

  export default {
    props: ['owner', 'id'],

    data: () => ({
      bio: "",
      editing: false,
    }),

    beforeMount() {
      axios.get('api/users/bio', {
        params: {
          userId: this.$user.id,
          userToken: this.$user.token,
          id: this.id
        }
      }).then(response => {
        if (response.data && response.data.content)
          this.bio = response.data.content
      })
    },

    methods: {
      edit () {
        if (this.editing) {
          axios.post('api/users/bio', {
            id: this.$user.id,
            token: this.$user.token,
            bio: this.bio
          }).then(response => {
            if (response.data) {
              this.editing = false
            }
          })
        } else {
          this.editing = true
        }
      }
    },
  }
</script>

<style>

</style>
