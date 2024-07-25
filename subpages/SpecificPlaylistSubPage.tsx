import {View, Text, FlatList} from 'react-native';
import React, {memo, useEffect, useState} from 'react';
import {MMKV} from 'react-native-mmkv';
import HistorySongCard from '../components/HistorySongCard';

type itemtype = {
  title: string;
  id: string;
  artist: string;
  duration: number;
  plays: string;
  albumid: string;
  thumbnail: string;
};

const renderItem = ({item}: {item: itemtype}) => (
  <HistorySongCard
    title={item.title}
    id={item.id}
    artist={item.artist}
    duration={item.duration}
    albumid={item.albumid}
    plays={item.plays} // assuming this was meant to be plays instead of duration again
    url={item.thumbnail}
    hdurl={item.thumbnail}
  />
);

const SpecificPlaylistSubPage = ({posvalue}: {posvalue: any}) => {
  const storage = new MMKV();
  const [data, setdata] = useState([]);
  const jsonString = storage.getString('history9');

  useEffect(() => {
    let myArray = [];
    if (jsonString) {
      try {
        // Convert JSON string back to array
        myArray = JSON.parse(jsonString);
      } catch (e) {
        console.error('Error parsing JSON string from MMKV', e);
      }
    }
    setdata(myArray);
  }, []);

  return (
    <View className="flex flex-col ml-2">
      <View className="mt-10 ml-3 mb-3 justify-center">
        <Text className="text-white text-3xl">Your Songs</Text>
      </View>
      <FlatList
        contentContainerStyle={{paddingTop: 5, paddingRight: 10}}
        style={{height: '80%', width: '100%'}}
        data={data}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
      />
    </View>
  );
};

export default memo(SpecificPlaylistSubPage);
