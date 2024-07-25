import {
  View,
  Text,
  SafeAreaView,
  Image,
  Dimensions,
  Pressable,
} from 'react-native';
import React, {memo, useEffect, useRef, useState} from 'react';
import SideBar from '../components/SideBar';
import {mainarray} from '../constants';
import TrackPlayer, {
  Track,
  Event,
  useProgress,
} from 'react-native-track-player';
import {Slider} from '@miblanchard/react-native-slider';
import {StackActions, useNavigation} from '@react-navigation/native';
import {State} from 'react-native-track-player';
import {transformer} from '../metro.config';
import 'event-target-polyfill';
import 'web-streams-polyfill';
import 'text-encoding-polyfill';
import 'react-native-url-polyfill/auto';
import Innertube from 'youtubei.js';
import {MMKV} from 'react-native-mmkv';
import SubPage from './SubPage';

const HomePage = () => {
  const progress = useProgress();
  const [duration, setduration] = useState<number | undefined>(0);

  const [currentindex, setcurrentindex] = useState(1);
  const [nothing, setnothing] = useState(0);

  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  const [title, settitle] = useState<string | undefined>('');
  const [author, setauthor] = useState<string | undefined>('');
  const [thumbnail, setthumbnail] = useState<string | undefined>('');
  const navigation = useNavigation();

  const [isPlaying, setIsPlaying] = useState(false);
  const [id, setid] = useState('');
  const [fetchstring, setfetchstring] = useState('');
  const storage = new MMKV();
  const [direction, setdirection] = useState('up');

  useEffect(() => {
    const handleChange = ({window}: {window: any}) => {
      setDimensions(window);
    };

    const subscription = Dimensions.addEventListener('change', handleChange);

    return () => {
      subscription?.remove();
    };
  }, []);

  useEffect(() => {
    const onTrackChange = TrackPlayer.addEventListener(
      Event.PlaybackActiveTrackChanged,
      async () => {
        const currentTrack = await TrackPlayer.getActiveTrack();
        if (currentTrack?.id !== undefined) {
          setnothing(1);
          setauthor(currentTrack?.artist);
          settitle(currentTrack?.title);
          setthumbnail(currentTrack?.artwork);
          setduration(currentTrack?.duration);
          setid(currentTrack?.id);
          setfetchstring(currentTrack?.fromtype);
        }
      },
    );

    return () => {
      onTrackChange.remove();
    };
  }, []);

  useEffect(() => {
    const fetchPlaybackState = async () => {
      const state = await TrackPlayer.getPlaybackState();
      setIsPlaying(state.state === State.Playing);
    };

    const onPlaybackStateChange = TrackPlayer.addEventListener(
      Event.PlaybackState,
      fetchPlaybackState,
    );

    // Fetch initial playback state
    fetchPlaybackState();

    return () => {
      onPlaybackStateChange.remove();
    };
  }, []);

  const handleforward = async (id: string, fromtype: string) => {
    setthumbnail('https:lolol.gif');
    settitle('loading');
    setauthor('loading');
    await TrackPlayer.reset();
    let fetchstring = 'history9';
    if (fromtype === 'historycard') fetchstring = 'history9';
    else if (fromtype === 'favoritecard') fetchstring = 'favorite1';
    else if (fromtype === 'downloadcard') fetchstring = 'downloads';
    else fetchstring = fromtype;

    try {
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

      const tube = await Innertube.create();
      for (let i = 0; i < myArray.length; i++) {
        if (myArray[i].id === id) {
          // Calculate circular previous index
          const prevIndex = (i + 1 + myArray.length) % myArray.length;
          const data = await tube.music.getInfo(myArray[prevIndex].id);
          const other = data.getStreamingInfo();
          await TrackPlayer.add({
            id: myArray[prevIndex].id,
            url: `${other.audio_sets[0].representations[0].segment_info?.base_url}.mp3`,
            title: myArray[prevIndex].title,
            artist: myArray[prevIndex].artist,
            artistid: myArray[prevIndex].artistid,
            albumid: myArray[prevIndex].albumid,
            plays: myArray[prevIndex].plays,
            artwork: myArray[prevIndex].thumbnail,
            duration: myArray[prevIndex].duration,
            fromtype: fromtype,
          });
          break;
        }
      }
      await TrackPlayer.play();
    } catch (error) {
      console.error('Error playing music:', error);
    }
  };

  useEffect(() => {
    const onStateChange = TrackPlayer.addEventListener(
      Event.PlaybackState,
      async () => {
        const currentTrack = await TrackPlayer.getPlaybackState();

        if (currentTrack.state === 'ended') handleforward(id, fetchstring);
      },
    );

    return () => {
      onStateChange.remove();
    };
  }, [id, fetchstring]);

  const truncateText = (text: string | undefined, maxLength: number) => {
    if (text === undefined) return;
    if (text.length > maxLength) {
      return text.substring(0, maxLength) + '...';
    }
    return text;
  };

  const handleindex = (data: any) => {
    setcurrentindex(data);

    if (currentindex - data < 0) setdirection('down');
    else {
      setdirection('up');
    }
  };

  return (
    <SafeAreaView>
      <View className="flex flex-row justify-end bg-black h-full w-full">
        <SideBar
          type={'home'}
          array={mainarray}
          initial="Songs"
          handleIndex={handleindex}
        />
        <View
          className=" flex flex-col pl-1"
          style={
            dimensions.width > dimensions.height
              ? {width: '86%', height: '110%'}
              : {width: '80%', height: '110%'}
          }>
          {<SubPage data={currentindex} direction={direction} />}
        </View>
      </View>
      {nothing ? (
        <Pressable
          className="absolute bottom-0 w-full h-fit bg-black flex flex-col justify-between pb-1.5"
          onPress={() => {
            const pushAction = StackActions.push('Player', {
              defaulturl: thumbnail,
              defaulttitle: title,
              defaultpause: !isPlaying,
              where: 'home',
            });
            navigation.dispatch(pushAction);
          }}>
          <View className=" mt-0.5 mb-1 items-center">
            <Slider
              containerStyle={{
                width: '96%',
                height: '1%',
              }}
              trackStyle={{
                height: 4,
              }}
              animationType="timing"
              value={progress.position}
              minimumValue={0}
              maximumValue={duration}
              thumbTintColor="transparent"
              minimumTrackTintColor="#FFFFFF"
              maximumTrackTintColor="gray"
              thumbTouchSize={{
                width: 1,
                height: 1,
              }}
              trackRightPadding={0}
              step={1}
            />
          </View>
          <View className="flex flex-row justify-between ml-7 mr-3 py-2">
            <View className="self-center flex flex-row">
              <View className="h-10 w-10 self-center flex flex-row">
                <Image
                  className="w-full h-full"
                  source={
                    thumbnail === undefined || thumbnail.length === 0
                      ? require('../public/icons/albumplaceholder.jpg')
                      : {uri: thumbnail}
                  }
                />
              </View>

              <View className="flex flex-col self-center ml-3 w-fit">
                <Text className="text-white text-sm">
                  {title && title.length > 0
                    ? truncateText(title, 15)
                    : 'loading'}
                </Text>
                <Text className="text-blue-100 text-xs mt-1">
                  {author && author.length > 0
                    ? truncateText(author, 15)
                    : 'loading'}
                </Text>
              </View>
            </View>

            <View className="flex flex-row">
              <Pressable
                className="p-3 self-center"
                onPress={() => {
                  if (isPlaying) {
                    TrackPlayer.pause();
                  } else {
                    TrackPlayer.play();
                  }
                }}>
                <Image
                  tintColor={'#C1C1C1'}
                  className="h-5 w-5"
                  source={
                    isPlaying
                      ? require('../public/icons/pause.png')
                      : require('../public/icons/play-buttton.png')
                  }
                />
              </Pressable>
              <Pressable
                className="p-3 self-center"
                onPress={() => handleforward(id, fetchstring)}>
                <Image
                  tintColor={'#C1C1C1'}
                  className="h-5 w-5"
                  source={require('../public/icons/next.png')}
                />
              </Pressable>
            </View>
          </View>
        </Pressable>
      ) : null}
    </SafeAreaView>
  );
};

export default memo(HomePage);
