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
  Picker,
  FlatList
} from 'react-native';

import { connect } from 'react-redux';
import { getQAList } from '../../actions/qa.js';
import { standardColor, nodeColor, idColor } from '../../constants/colorConfig';
import Icon from 'react-native-vector-icons/Ionicons';

import { getQAUrl } from '../../dao';

import { changeScrollType } from '../../actions/app';

import TopicItem from '../shared/QaItem'
import FooterProgress from '../shared/FooterProgress'

let toolbarHeight = 56;
let releasedMarginTop = 0;
let prevPosition = -1;

class Qa extends Component {
  static navigationOptions = {
    tabBarLabel: '问答',
    drawerLabel: '问答'
  };

  constructor(props) {
    super(props);

    this.state = {
      type: 'all',
      sort: 'obdate',
      isRefreshing: false,
      isLoadingMore: false
    }
  }

  _renderHeader = () => {
    const { modeInfo } = this.props.screenProps
    return (
      <View style={{
        flex: -1,
        elevation: 2,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        height: 40,
        paddingTop: 3,
        backgroundColor: modeInfo.backgroundColor
      }}>
        <Picker style={{
          flex: 1,
          borderWidth: 1,
          color: modeInfo.standardTextColor
        }}
          prompt='选择类型'
          selectedValue={this.state.type}
          onValueChange={this.onValueChange.bind(this, 'type')}>
          <Picker.Item label="全部" value="all" />
          <Picker.Item label="PSN游戏" value="psngame" />
          <Picker.Item label="节点" value="node" />
        </Picker>
        <Picker style={{
          flex: 1,
          color: modeInfo.standardTextColor
        }}
          prompt='排序'
          selectedValue={this.state.sort}
          onValueChange={this.onValueChange.bind(this, 'sort')}>
          <Picker.Item label="综合排序" value="obdate" />
          <Picker.Item label="最新" value="date" />
        </Picker>
      </View>
    )
  }

  onValueChange = (key: string, value: string) => {
    const newState = {};
    newState[key] = value;
    this.setState(newState, () => {
      this._onRefresh()
    });
  };

  componentWillReceiveProps = (nextProps) => {
    if (this.props.screenProps.modeInfo.isNightMode != nextProps.screenProps.modeInfo.isNightMode) {
      this.props.screenProps.modeInfo = nextProps.screenProps.modeInfo;
    } else if (this.props.screenProps.searchTitle !== nextProps.screenProps.searchTitle) {
      this._onRefresh(
        nextProps.screenProps.searchTitle
      )
    } else {
      this.setState({
        isRefreshing: false,
        isLoadingMore: false
      })
    }
  }

  componentDidUpdate = () => {

  }

  componentDidMount = () => {
    const { qa: qaReducer } = this.props;
    if (qaReducer.page === 0) {
      this._onRefresh();
    }
  }

  _onRefresh = (title = '') => {
    const { qa: qaReducer, dispatch } = this.props;

    this.setState({
      isRefreshing: true
    })

    const { type, sort } = this.state
    dispatch(getQAList(1, {
        type,
        sort,
        title: typeof title !== 'undefined' ? title : this.props.screenProps.searchTitle
      })
    );
  }

  _loadMoreData = () => {
    const { qa: qaReducer, dispatch } = this.props;
    const { type, sort } = this.state
    let page = qaReducer.page + 1;
    dispatch(getQAList(page, {
        type, 
        sort,
        title: this.props.screenProps.searchTitle
      })
    );
  }

  _onEndReached = () => {
    if (this.state.isRefreshing || this.state.isLoadingMore) return

    this.setState({
      isLoadingMore: true
    })
    this._loadMoreData();
  }


  ITEM_HEIGHT = 74 + 7

  _renderItem = ({ item: rowData, index }) => {
    const { modeInfo, navigation } = this.props.screenProps
    const { ITEM_HEIGHT } = this
    return <TopicItem {...{
      navigation,
      rowData,
      modeInfo,
      ITEM_HEIGHT
    }} />
  }

  render() {
    const { qa: qaReducer } = this.props;
    const { modeInfo } = this.props.screenProps
    // console.log('Community.js rendered');

    return (
      <View style={{ backgroundColor: modeInfo.backgroundColor, flex: 1 }}>
        {this._renderHeader()}
        <FlatList style={{
          flex: 1,
          backgroundColor: modeInfo.backgroundColor
        }}
          ref={flatlist => this.flatlist = flatlist}
          refreshControl={
            <RefreshControl
              refreshing={this.state.isRefreshing}
              onRefresh={this._onRefresh}
              colors={[modeInfo.standardColor]}
              progressBackgroundColor={modeInfo.backgroundColor}
              ref={ref => this.refreshControl = ref}
            />
          }
          ListFooterComponent={() => <FooterProgress isLoadingMore={this.state.isLoadingMore} />}
          data={qaReducer.qas}
          keyExtractor={(item, index) => `${item.id}::${item.views}::${item.count}`}
          renderItem={this._renderItem}
          onEndReached={this._onEndReached}
          onEndReachedThreshold={0.5}
          extraData={modeInfo}
          windowSize={21}
          updateCellsBatchingPeriod={1}
          initialNumToRender={42}
          maxToRenderPerBatch={8}
          disableVirtualization={false}
          contentContainerStyle={styles.list}
          getItemLayout={(data, index) => (
            {length: this.ITEM_HEIGHT, offset: this.ITEM_HEIGHT * index, index}
          )}
          viewabilityConfig={{
            minimumViewTime: 1,
            viewAreaCoveragePercentThreshold: 0,
            waitForInteractions: true
          }}
        />
      </View>
    )
  }

}

const styles = StyleSheet.create({
  avatar: {
    width: 50,
    height: 50,
  }
});


function mapStateToProps(state) {
  return {
    qa: state.qa
  };
}

export default connect(
  mapStateToProps
)(Qa);
