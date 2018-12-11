<template>
  <v-layout row>
    <v-flex xs3>
      <v-list>
        <v-list-tile v-if="!conversations.length">You have no match to chat with</v-list-tile>
        <v-list-tile
          v-for="(conversation, index) in conversations"
          :key="index"
          :to="routeTo(conversation.idLiked, conversation.idNotification, conversation.readed)"
          :class="conversation.readed ? '' : 'bg_notif'"
        >
          <v-list-tile-title>
            {{conversation.nickname}}
          </v-list-tile-title>
        </v-list-tile>
      </v-list>
    </v-flex>
    <v-flex xs9 px-2>
      <v-container align-start class="chat-window" id="chatContainer">
        <v-layout row wrap>
          <v-flex v-if="!messages.length" xs12>No message sent</v-flex>
          <v-flex
            xs7
            my-1
            v-for="(message, index) in messages.slice().reverse()"
            :key="index"
            :offset-xs5="message.idUser == $user.id"
          >
            <v-card :class="message.idUser == $user.id ? 'text-xs-right' : 'text-xs-left'" :dark="message.idUser == $user.id" :color="message.idUser == $user.id ? 'primary' : ''">
              <v-card-text>{{message.message}}</v-card-text>
            </v-card>
          </v-flex>
          <div id="convEnd" style="visibility:hidden;overflow:hidden"></div>
        </v-layout>
      </v-container>
      <v-divider></v-divider>
      <v-flex py-2>
        <v-form @keyup.native.enter="sendMessage">
        <v-text-field
          v-model="newMessage"
          append-outer-icon="send"
          box
          clearable
          label="Message"
          type="text"
          @click:append-outer="sendMessage"
        >
        </v-text-field>
      </v-form>
      </v-flex>
    </v-flex>
  </v-layout>
</template>

<script>
  import axios from 'axios'

  export default {
    data: () => ({
      conversations: [],
      messages: [],
      id: 0,
      newMessage: "",
      interval: null,
    }),
    beforeMount () {
      if (this.$route.query.id)
        this.id = this.$route.query.id
      this.getConversations()
    },
    mounted () {
      document.getElementById("chatContainer").scrollTop = document.getElementById("chatContainer").scrollHeight
    },
    methods: {
      routeTo (idProfile, idNotification, readed) {
        if (!readed) {
          axios.post('api/users/readNotification', {
            userId: this.$user.id,
            userToken: this.$user.token,
            id: idNotification
          })
        }
        return ({path:'/chat', query: {id: idProfile}})
      },
      getConversations () {
        axios.get('api/users/conversations', {
          params: {
            userId: this.$user.id,
            userToken: this.$user.token,
          }
        }).then(response => {
          if (response.data && response.data.length) {
            this.conversations = response.data
            if (!this.id) {
              this.$router.replace({path:'/chat', query: {id: this.conversations[0].idLiked}})
              this.id = this.conversations[0].idLiked
            }
            clearInterval(this.interval)
            this.interval = setInterval(() => {
              this.getMessages()
            }, 3000)
          }
        })
      },
      getMessages () {
        axios.get('api/users/messages', {
          params: {
            userId: this.$user.id,
            userToken: this.$user.token,
            id: this.id
          }
        }).then(response => {
          if (response.data && response.data.length) {
            if (this.messages.length != response.data.length) {
              document.getElementById("chatContainer").scrollTop = document.getElementById("chatContainer").scrollHeight
            }
            this.messages = response.data
          }
        })
      },
      sendMessage () {
        axios.post('api/users/message', {
          userId: this.$user.id,
          userToken: this.$user.token,
          id: this.id,
          message: this.newMessage
        }).then(response => {
          if (response.data) {
            this.newMessage = ""
            this.getMessages()
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
  .chat-window {
    height: 75vh;
    overflow-y: auto;
  }
</style>
