<template>
  <v-layout row>
    <v-flex xs3>
      <v-list>
        <v-list-tile v-if="!conversations.length">You have no match to chat with</v-list-tile>
        <v-list-tile
          v-for="(conversation, index) in conversations"
          :key="index"
          :to="'/chat?id='+conversation.idLiked"
          @click="routeTo(conversation.idLiked, conversation.idNotification, conversation.readed)"
          :class="(conversation.readed ? '' : 'bg_notif') + (conversation.idLiked == id ? ' selected' : '')"
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
          ref="messageInput"
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
    }),
    beforeMount () {
      if (this.$route.query.id)
        this.id = this.$route.query.id
      this.getConversations()
    },
    mounted () {
      document.getElementById("chatContainer").scrollTop = document.getElementById("chatContainer").scrollHeight
    },
    beforeRouteLeave (from, to, next) {
      this.clearAllInterval()
      next()
    },
    beforeDestroy () {
      this.clearAllInterval()
    },
    methods: {
      clearAllInterval () {
        this.$chatInterval = this.$chatInterval.filter(e => {
          clearInterval(e)
          return false
        })
      },
      routeTo (idProfile, idNotification, readed) {
        if (!readed) {
          axios.post('api/users/readNotification', {
            userId: this.$user.id,
            userToken: this.$user.token,
            id: idNotification
          })
        }
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
              this.id = this.conversations[0].idLiked
            }
            this.clearAllInterval()
            this.getMessages()
            this.$chatInterval.push(setInterval(() => {
              this.getMessages()
            }, 3000))
          }
        })
      },
      getMessages () {
        if (this.conversations.length) {
          axios.get('api/users/messages', {
            params: {
              userId: this.$user.id,
              userToken: this.$user.token,
              id: this.id
            }
          }).then(response => {
            if (response.data && response.data.length) {
              if (this.messages.length != response.data.length) {
                this.messages = response.data
                this.$nextTick(() => {
                  document.getElementById("chatContainer").scrollTop = document.getElementById("chatContainer").scrollHeight
                  this.$refs.messageInput.focus()
                })
              }
            }
            else
              this.messages = []
          })
        }
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
  .selected {
    border : solid 2px rgb(49, 106, 176);
  }
  .chat-window {
    height: 75vh;
    overflow-y: auto;
  }
</style>
