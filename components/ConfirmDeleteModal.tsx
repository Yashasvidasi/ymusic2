import {View, Text, Image} from 'react-native';
import React from 'react';

const ConfirmDeleteModal = ({
  thumbnail,
  defaulttitle,
  author,
}: {
  thumbnail: string;
  defaulttitle: string;
  author: string;
}) => {
  return (
    <View
      className="flex border border-white flex-col p-4 "
      style={{
        position: 'absolute',
        bottom: 0,
        width: '100%',
        backgroundColor: 'black',
        zIndex: 10,
        height: 220,
      }}>
      <View className="flex flex-col">
        <Text>Confirm to Remove</Text>
        <View>
          <Text>Confirm</Text>
        </View>
      </View>
    </View>
  );
};

export default ConfirmDeleteModal;
