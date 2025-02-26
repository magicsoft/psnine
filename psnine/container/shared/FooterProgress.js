import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ListView,
  Image,
  TouchableNativeFeedback,
  RefreshControl,
  InteractionManager,
  FlatList,
  ProgressBarAndroid,
  Animated
} from 'react-native';

export default class FooterProgress extends React.PureComponent {
  shouldComponentUpdate = (nextProps) => {
    if (nextProps.isLoadingMore !== this.props.isLoadingMore) return true
    return false
  }
  render() {
    return this.props.isLoadingMore ? (
      <View style={{flexDirection:'row', flex: 1, height: 15, alignItems: 'flex-end'}}>
        <ProgressBarAndroid style={{flex:1,
          height: 15,
          transform: [
            {
              rotateZ: '180deg'
            }
          ]
        }}  styleAttr="Horizontal"/>
        <ProgressBarAndroid style={{flex:1,height: 15,}} styleAttr="Horizontal" />
      </View>
    ) : (<View style={{flexDirection:'row', flex: 1, height: 15, alignItems: 'flex-end'}}/>)
  }
}