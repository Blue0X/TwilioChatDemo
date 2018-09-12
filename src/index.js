import React, { Component } from 'react';
import { StyleSheet, Text, View, Button, Modal, SafeAreaView } from 'react-native';
import { Client as TwilioChatClient } from 'twilio-chat';
import { GiftedChat } from 'react-native-gifted-chat';
import CameraRollPicker from 'react-native-camera-roll-picker';
import RNFetchBlob from 'rn-fetch-blob';

async function getToken(identity) {
  // eslint-disable-next-line no-undef
  const res = await fetch(`http://localhost:3002/token?identity=${identity}`);
  return res.json();
}

const STYLES = StyleSheet.create({
  container: {
    flex: 1,
  },
  infoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerContainer: {
    marginTop: 5,
    marginLeft: 10,
    marginRight: 10,
    marginBottom: 10,
  },
  footerText: {
    fontSize: 14,
    color: '#aaa',
  },
});

export default class App extends Component {
  constructor(props) {
    super(props);
    this.client = null;
    this.channel = null;
    this.images = [];
    this.state = {
      messages: [],
      connectionState: 'Connecting...',
      customerId: null,
      loadEarlier: false,
      isLoadingEarlier: false,
      messageIndex: 0,
      modalVisible: false,
      uploading: false,
    };
  }

  componentDidMount() {
    this.initializeMessenging();
  }

  componentWillUnmount() {
    if (this.client) {
      this.client.shutdown();
    }
  }

  onSend = (messages = []) => {
    this.channel.sendMessage(messages[0].text);
  }

  onLoadEarlier = () => {
    this.setState({ isLoadingEarlier: true });
    this.channel.getMessages(30, this.state.messageIndex - 1).then((messages) => {
      this.handleBatch(messages);
      this.setState({
        isLoadingEarlier: false,
      });
    });
  }

  onSendPhoto = () => {
    this.setState({ modalVisible: true });
  }

  onSelectDone = () => {
    this.setState({ modalVisible: false });
    // console.log(this.images);
    if (!this.images.length) return;
    this.setState({ uploading: true });
    RNFetchBlob.fs.readFile(this.images[0].uri, 'base64').then((data) => {
      const { Buffer } = require('buffer/');
      const media = Buffer.from(data, 'base64');
      this.channel.sendMessage({
        contentType: 'image/png',
        media,
      }).then(() => this.setState({ uploading: false }));
    });
  }

  setModalVisible = (visible) => {
    this.setState({ modalVisible: visible });
  }

  selectImages = (images) => {
    this.images = images;
  }

  async initializeMessenging() {
    const identity = 'Alice';
    const jsonRes = await getToken(identity);
    if (!jsonRes) {
      this.setState({ connectionState: 'Error!' });
      return;
    }
    // console.log(jsonRes);

    this.client = await TwilioChatClient.create(jsonRes.token);
    this.client.on('connectionStateChanged', state => console.log('connectionStateChanged -> ', state));

    // await this.client.getSubscribedChannels();
    try {
      this.channel = await this.client.getChannelByUniqueName('general');
    } catch (error) {
      this.channel = await this.client.createChannel({
        uniqueName: 'general',
        friendlyName: 'General Chat Channel',
      });
      this.channel.join();
    }

    this.channel.on('messageAdded', message => this.handleReceive(message));
    this.channel.getMessages(30).then((messages) => {
      this.handleBatch(messages);
    });
    this.setState({
      connectionState: 'Connected',
      customerId: identity,
    });
  }

  handleBatch = async (messages) => {
    const messageArray = [];
    for (let i = 0; i < messages.items.length; i += 1) {
      // eslint-disable-next-line
      messageArray[i] = await this.parseMessage(messages.items[i]);
    }
    this.setState({
      messages: [...this.state.messages, ...messageArray.reverse()],
      loadEarlier: messages.hasPrevPage,
      messageIndex: messages.items[0].index,
    });
  }

  handleReceive = async (message) => {
    const newMsg = await this.parseMessage(message);
    this.setState({ messages: [newMsg, ...this.state.messages] });
  }

  parseMessage = async (message) => {
    const newMsg = {
      _id: message.sid,
      text: message.body,
      type: message.type,
      createdAt: new Date(message.timestamp),
      attributes: message.attributes,
      system: message.system || false,
      user: {
        _id: message.author,
        avatar: 'https://raw.githubusercontent.com/Blue0X/TwilioChatDemo/master/assets/avatar-girl.png',
      },
    };

    if (message.type === 'media') {
      newMsg.image = await message.media.getContentUrl();
    }

    return newMsg;
  };

  renderFooter = () => {
    if (this.state.uploading) {
      return (
        <View style={STYLES.footerContainer}>
          <Text style={STYLES.footerText}>
            Uploading...
          </Text>
        </View>
      );
    }
    return null;
  }

  render() {
    return (
      <SafeAreaView style={STYLES.container}>
        { this.state.connectionState === 'Connected' ?
          <View style={{ flex: 1 }}>
            <GiftedChat
              messages={this.state.messages}
              onSend={this.onSend}
              user={{ _id: this.state.customerId }}
              loadEarlier={this.state.loadEarlier}
              isLoadingEarlier={this.state.isLoadingEarlier}
              onLoadEarlier={this.onLoadEarlier}
              renderFooter={this.renderFooter}
            />
            <Button title="Send photo" onPress={this.onSendPhoto} />
            <Modal
              animationType="slide"
              transparent={false}
              visible={this.state.modalVisible}
              onRequestClose={() => {
                this.setModalVisible(false);
              }}
            >
              <SafeAreaView style={{ flex: 1 }}>
                <Button title="Done" onPress={this.onSelectDone} />
                <CameraRollPicker
                  maximum={1}
                  imagesPerRow={4}
                  callback={this.selectImages}
                  selected={[]}
                />
              </SafeAreaView>
            </Modal>
          </View>
          :
          <View style={STYLES.infoContainer}>
            <Text>{ this.state.connectionState}</Text>
          </View>
        }
      </SafeAreaView>
    );
  }
}
