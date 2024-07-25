import {View, Text, Image, Pressable} from 'react-native';
import React, {memo} from 'react';

const OptionsModal = ({
  thumbnail,
  defaulttitle,
  author,
  handlemodal,
}: {
  thumbnail: any;
  defaulttitle: any;
  author: any;
  handlemodal: (data: boolean) => void;
}) => {
  return (
    <View
      className="flex flex-col p-4 "
      style={{
        position: 'absolute',
        bottom: 0,
        width: '100%',
        backgroundColor: 'black',
        zIndex: 10,
        height: 220,
      }}>
      <View className="flex flex-row justify-between">
        <View className="flex flex-row p-2 border border-gray-500 rounded-xl w-full">
          <View className="w-16 h-16 rounded-xl">
            <Image
              className="w-full h-full rounded-xl"
              source={{uri: thumbnail}}
            />
          </View>
          <View className="flex flex-col justify-center ml-3">
            <Text className="text-lg text-white">{defaulttitle}</Text>
            <Text className="text-base text-gray-500">{author}</Text>
          </View>
        </View>
      </View>

      <Pressable
        className="flex flex-row mt-8 border border-white p-2 rounded-2xl"
        onPress={() => handlemodal(true)}>
        <Image
          tintColor={'white'}
          className="w-5 h-5 mr-4 self-center"
          source={require('../public/icons/add.png')}
        />
        <Text className="text-lg text-white">Add to Playlist</Text>
      </Pressable>
    </View>
  );
};

export default memo(OptionsModal);
