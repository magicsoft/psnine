import React, { Component, PropTypes } from 'react'
import htmlToElement from './htmlToElement'
import {
  Linking,
  StyleSheet,
  Text,
  WebView,
  View,
  Dimensions,
  Button
} from 'react-native'

import MyDialog from '../../components/Dialog'
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width, height: SCEEN_HEIGHT } = Dimensions.get('window')

let WEBVIEW_REF = `WEBVIEW_REF`;
let toolbarActions = [
  { title: '刷新', iconName: 'md-refresh', show: 'always' },
];
let title = "TOPIC";

export default class HtmlView extends Component {
  constructor(props) {
    super(props)
    let height = this.props.style.height || '100%'
    if (height === '100%') {
      height = SCEEN_HEIGHT - 100
    }
    this.state = {
      width: this.props.style.width || '100%',
      height: height,
      modalVisible: false,
      canGoBack: false,
      title: '正在打开网页...'
    }
  }

  _onActionSelected = (index) => {
    switch (index) {
      case 0:
        return this.webview.reload();
    }
  }

  _pressButton = () => {
    this.setState({
      modalVisible: false,
      canGoBack: false
    })
  }

  render() {
    const cb = () => {
      if (this.state.canGoBack === true) {
        this.webview.goBack();
        return
      }
      this.setState({
        modalVisible: false,
        canGoBack: false
      });
    }
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 5, alignSelf: 'center', alignContent: 'center'  }}>
        <Button color={this.props.modeInfo.accentColor} style={{

        }} title={'打开网页'} onPress={() => { this.setState({ modalVisible: true }) }}></Button>
        {this.state.modalVisible && (
          <MyDialog modeInfo={this.props.modeInfo}
            modalVisible={this.state.modalVisible}
            onDismiss={cb}
            onRequestClose={cb}
            renderContent={() => (
              <View style={{
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: this.props.modeInfo.backgroundColor,
                opacity: 1
              }} borderRadius={2}>
                <Ionicons.ToolbarAndroid
                  navIconName="md-close"
                  overflowIconName="md-more"
                  iconColor={this.props.modeInfo.isNightMode ? '#000' : '#fff'}
                  title={this.state.title}
                  titleColor={this.props.modeInfo.isNightMode ? '#000' : '#fff'}
                  style={[styles.toolbar, {
                    height: 56,
                    width: width,
                    backgroundColor: this.props.modeInfo.standardColor
                  }]}
                  actions={toolbarActions}
                  onIconClicked={this._pressButton}
                  onActionSelected={this._onActionSelected}
                />
                <WebView
                  ref={webview => this.webview = webview}
                  startInLoadingState={true}
                  scalesPageToFit={true}
                  domStorageEnabled={true}
                  style={{ flex: 1, padding: 0, width: width, height: this.state.height }}
                  injectedJavaScript={'<script>window.location.hash = 1;document.title = document.height;</script>'}
                  javaScriptEnabled={true}
                  onNavigationStateChange={(navState) => {
                    this.setState({
                      canGoBack: navState.canGoBack,
                      title: navState.title
                    })
                  }}
                  scrollEnable={true}
                  source={{ uri: this.props.url }} />
              </View>
            )} />
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: '#F5FCFF',
  },
  toolbar: {
    height: 56,
    elevation: 4,
  },
  selectedTitle: {
    //backgroundColor: '#00ffff'
    //fontSize: 20
  },
  avatar: {
    width: 50,
    height: 50,
  }
});

HtmlView.propTypes = {
  value: PropTypes.string,
  stylesheet: PropTypes.object,
  onLinkPress: PropTypes.func,
  onError: PropTypes.func,
  renderNode: PropTypes.func,
  defaultTextColor: PropTypes.string
}

HtmlView.defaultProps = {
  onLinkPress: url => Linking.openURL(url),
  onError: console.error.bind(console),
  defaultTextColor: '#000',
}
