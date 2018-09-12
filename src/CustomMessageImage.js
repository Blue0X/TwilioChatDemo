import React from 'react';
import { View } from 'react-native';
import Image from 'react-native-image-progress';
import * as Progress from 'react-native-progress';
import PropTypes from 'prop-types';

const CustomMessageImage = props => (
  <View style={{ marginTop: 16, width: 240 }}>
    <Image
      source={{ uri: props.currentMessage.image }}
      indicator={Progress.Bar}
      indicatorProps={{
        size: 80,
        borderWidth: 0,
        color: 'rgba(150, 150, 150, 1)',
        unfilledColor: 'rgba(200, 200, 200, 0.2)',
      }}
      style={{
        width: 240,
        height: 180,
      }}
    />
  </View>
);

CustomMessageImage.propTypes = {
  currentMessage: PropTypes.shape({
    image: PropTypes.string.isRequired,
  }).isRequired,
};

export default CustomMessageImage;

