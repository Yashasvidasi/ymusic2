import {View, Text, Image, TouchableHighlight} from 'react-native';
import React, {useEffect, useState, memo} from 'react';
import {useNavigation} from '@react-navigation/native';
import {StackActions} from '@react-navigation/native';
import 'event-target-polyfill';
import 'web-streams-polyfill';
import 'text-encoding-polyfill';
import 'react-native-url-polyfill/auto';
import Innertube from 'youtubei.js';
import TrackPlayer from 'react-native-track-player';
import {MMKV} from 'react-native-mmkv';

const RecommendationCard = (props: {
  title: string;
  url: string;
  hdurl: string;
  id: string;
  artist: string;
  duration: number;
  plays: string;
  albumid: string;
}) => {
  const storage = new MMKV();
  const [pause, setpause] = useState(false);
  const navigation = useNavigation();

  const pushAction = StackActions.push('Player', {
    defaulturl: props.hdurl,
    defaulttitle: props.title,
    defaultpause: pause,
    where: 'songcard',
  });

  const truncateText = (text: string, maxLength: number) => {
    if (text.length > maxLength) {
      return text.substring(0, maxLength) + '...';
    }
    return text;
  };

  //-----AIzaSyDTI8s_USJq4SxFGRLZoTcdrZfgP5RvO-c

  const checkifdownloaded = () => {
    const jsonString = storage.getString('downloads');
    let myArray = [];

    if (jsonString) {
      try {
        // Convert JSON string back to array
        myArray = JSON.parse(jsonString);
      } catch (e) {
        console.error('Error parsing JSON string from MMKV', e);
      }
    }
    for (let i = 0; i < myArray.length; i++) {
      if (myArray[i].id === props.id) {
        return myArray[i];
      }
    }
    return null;
  };

  const handlepush = async () => {
    TrackPlayer.reset();
    navigation.dispatch(pushAction);
    await TrackPlayer.reset();
    const jsonString = storage.getString('history9');
    let myArray = [];

    if (jsonString) {
      try {
        // Convert JSON string back to array
        myArray = JSON.parse(jsonString);
      } catch (e) {
        console.error('Error parsing JSON string from MMKV', e);
      }
    }
    const getstring = checkifdownloaded();
    let obj;
    if (getstring !== null) {
      await TrackPlayer.add({
        id: getstring.id,
        url: getstring.url,
        title: getstring.title,
        artist: getstring.artist,
        artistid: getstring.artistid,
        albumid: getstring.albumid,
        plays: getstring.plays,
        artwork: getstring.thumbnail,
        duration: getstring.duration,
        fromtype: 'historycard',
      });
      obj = {
        id: getstring.id,
        title: getstring.title,
        artist: getstring.artist,
        artistid: getstring.artistid,
        albumid: props.albumid,
        plays: props.plays,
        thumbnail: getstring.thumbnail,
        duration: getstring.duration,
      };
    } else {
      const url = `https://yt-api.p.rapidapi.com/dl?id=${props.id}`;
      let data;
      const options = {
        method: 'GET',
        headers: {
          'x-rapidapi-key':
            '63174f4fe2msh89faee61e7b2447p1e50f2jsn58607683b0c0',
          'x-rapidapi-host': 'yt-api.p.rapidapi.com',
        },
      };

      const response = await fetch(url, options);
      data = await response.json();
      try {
        await TrackPlayer.add({
          id: props.id,
          url: `${data!.adaptiveFormats[data!.adaptiveFormats.length - 1].url}`,
          title: data!.title,
          artist: data!.channelTitle.slice(0, data!.channelTitle.length - 8),
          artistid: data!.channelId,
          albumid: props.albumid,
          plays: props.plays,
          artwork: data!.thumbnail[data!.thumbnail.length - 1].url,
          duration: data!.lengthSeconds,
          fromtype: 'historycard',
        });

        obj = {
          id: data!.id,
          title: data!.title,
          artist: data!.channelTitle.slice(0, data!.channelTitle.length - 8),
          artistid: data!.channelId,
          albumid: props.albumid,
          plays: props.plays,
          thumbnail: data!.thumbnail[data!.thumbnail.length - 1].url,
          duration: data!.lengthSeconds,
        };
      } catch (error) {
        console.error('Error playing music:', error);
      }
    }

    await TrackPlayer.play();
    let dd = 0;
    let found = 0;
    for (let i = 0; i < myArray.length; i++) {
      if (myArray[i].id === props.id) {
        found = 1;
        dd = i;
      }
    }

    if (found) {
      myArray.splice(dd, 1);
      myArray.unshift(obj);
    } else {
      myArray.unshift(obj);
    }

    const updatedJsonString = JSON.stringify(myArray);

    storage.set('history9', updatedJsonString);
  };

  useEffect(() => {
    async () => {
      const currentTrack = await TrackPlayer.getPlaybackState();

      if (currentTrack.state === 'paused') setpause(true);
      else setpause(false);
    };
  }, []);

  return (
    <TouchableHighlight
      onPress={() => {
        handlepush();
      }}>
      <View className="flex flex-row h-20 border-gray-400 p-2 my-1 rounded-xl w-64 border mx-2">
        <View className="h-12 w-12 self-center ml-3">
          <Image className="h-full w-full" source={{uri: props.url}} />
        </View>
        <View
          className="flex flex-col ml-5 self-center "
          style={{
            width: '62%',
          }}>
          <Text
            className={`text-white flex-1 mb-1.5 ${
              props.title.length > 20 ? 'text-xs' : 'text-sm'
            } `}>
            {truncateText(props.title, 25)}
          </Text>
          <View className="flex flex-row justify-between">
            <Text className="text-xs text-gray-400">
              {truncateText(props.artist, 20)}
            </Text>
          </View>
        </View>
      </View>
    </TouchableHighlight>
  );
};

export default memo(RecommendationCard);
