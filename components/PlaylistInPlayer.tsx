import {View, Text, Image, Pressable, FlatList} from 'react-native';
import React, {useCallback, useState, memo, useEffect} from 'react';
import {
  RouteProp,
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import {MMKV} from 'react-native-mmkv';
import PlayerPlaylistCard from './PlayerPlaylistCard';
import TrackPlayer, {Event} from 'react-native-track-player';

type itemtype = {
  title: string;
  id: string;
  artist: string;
  duration: number;
  plays: string;
  albumid: string;
  thumbnail: string;
};

type RootStackParamList = {
  Player: {
    fetchtype: {fetchstring: string};
    current: {id: string};
  };
};

type PlayerScreenRouteProp = RouteProp<RootStackParamList, 'Player'>;

const PlaylistInPlayer = () => {
  const storage = new MMKV();
  const route = useRoute<PlayerScreenRouteProp>();
  const {fetchtype, current} = route.params;
  const navigation = useNavigation();
  const [mainarray, setmainarray] = useState<any[]>([]);
  const [activecard, setactivecard] = useState(current.id);
  const [queuename, setqueuename] = useState('');

  const getname = () => {
    let fetchstring = 'History';
    if (fetchtype.fetchstring === 'historycard') fetchstring = 'History';
    else if (fetchtype.fetchstring === 'downloadcard')
      fetchstring = 'Downloads';
    else if (fetchtype.fetchstring === 'favoritecard')
      fetchstring = 'Favorites';
    else {
      let myArray = [];
      const jsonString = storage.getString('playlist4');
      if (jsonString) {
        try {
          // Convert JSON string back to array
          myArray = JSON.parse(jsonString);
        } catch (e) {
          console.error('Error parsing JSON string from MMKV', e);
        }
      }
      let newarray = myArray.filter(
        (item: any) => item.id === fetchtype.fetchstring,
      );
      fetchstring = newarray[0].name;
    }
    setqueuename(fetchstring);
  };

  const getdata = async () => {
    let fetchstring = 'history9';
    if (fetchtype.fetchstring === 'historycard') fetchstring = 'history9';
    else if (fetchtype.fetchstring === 'downloadcard')
      fetchstring = 'downloads';
    else if (fetchtype.fetchstring === 'favoritecard')
      fetchstring = 'favorite1';
    else fetchstring = fetchtype.fetchstring;
    const jsonString = storage.getString(fetchstring);
    let myArray = [];

    if (jsonString) {
      try {
        // Convert JSON string back to array
        myArray = JSON.parse(jsonString);
      } catch (e) {
        console.error('Error parsing JSON string from MMKV', e);
      }
    }
    setmainarray(myArray);
  };

  useEffect(() => {
    const onTrackChange = TrackPlayer.addEventListener(
      Event.PlaybackActiveTrackChanged,
      async () => {
        const currentTrack = await TrackPlayer.getActiveTrack();

        if (currentTrack?.id !== undefined) {
          setactivecard(currentTrack?.id);
        }
      },
    );

    return () => {
      onTrackChange.remove();
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      getdata();
      getname();
    }, []),
  );

  const renderItem = ({item}: {item: itemtype}) => {
    return (
      <PlayerPlaylistCard
        title={item.title}
        id={item.id}
        artist={item.artist}
        duration={item.duration}
        albumid={item.albumid}
        plays={item.plays} // assuming this was meant to be plays instead of duration again
        url={item.thumbnail}
        hdurl={item.thumbnail}
        isactive={activecard === item.id ? true : false}
        fetchstring={fetchtype.fetchstring}
        changeactive={setactivecard}
      />
    );
  };

  return (
    <View className="h-full w-full bg-black z-50 pt-4">
      <View className="flex flex-row justify-between  mb-5">
        <Pressable
          className="self-center ml-5 p-2"
          onPress={() => {
            navigation.goBack();
          }}>
          <Image
            className="h-6 w-6 "
            style={{transform: [{rotate: '-90deg'}]}}
            tintColor={'gray'}
            source={require('../public/icons/back.png')}
          />
        </Pressable>

        <Text className="text-white self-center text-3xl mr-10 ">
          {queuename}
        </Text>
      </View>
      <FlatList
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingLeft: 20,
          paddingBottom: 30,
        }}
        data={mainarray}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
      />
    </View>
  );
};

export default memo(PlaylistInPlayer);
