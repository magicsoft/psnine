import React, { ToastAndroid } from 'react-native';
import * as ActionTypes from '../constants/actionTypes';

import { fetchTopics } from '../dao';

export function getTopicList(page = 1, {
  type = '',
  title = ''
}) {
  return dispatch => {
    return fetchTopics(page, type, title)
      .then(response => {
        dispatch(gotTopicList(response, page, type));
      }).catch(err => {
        console.error('communityError', err)
        dispatch(gotTopicListError());
        global.toast && global.toast('网络错误', 2000);
      });
  }
}

function gotTopicList(argument, page, type) {
  return {
    type: ActionTypes.GET_TOPICS_SUCCESS,
    value: argument,
    page: page,
  };
}

function gotTopicListError() {
  return {
    type: ActionTypes.GET_TOPICS_ERROR,
  };
}
