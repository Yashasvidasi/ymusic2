import {
  View,
  Text,
  Image,
  TouchableHighlight,
  Pressable,
  BackHandler,
  TouchableWithoutFeedback,
  ImageBackground,
  Dimensions,
} from 'react-native';
import React, {useEffect, useState, memo, useCallback} from 'react';
import {
  RouteProp,
  StackActions,
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import 'event-target-polyfill';
import 'web-streams-polyfill';
import 'text-encoding-polyfill';
import 'react-native-url-polyfill/auto';
import RNFS from 'react-native-fs';
import Innertube from 'youtubei.js';
import TrackPlayer, {
  Event,
  useProgress,
  RepeatMode,
  State,
} from 'react-native-track-player';
import {Slider} from '@miblanchard/react-native-slider';
import OptionsModal from './OptionsModal';
import PlayListModal from './PlayListModal';
import CreatePlayListModal from './CreatePlayListModal';
import {MMKV} from 'react-native-mmkv';

// Define the type for the route parameters
type RootStackParamList = {
  Player: {
    defaulturl: string;
    defaulttitle: string;
    defaultpause: boolean;
    where: string;
  };
};

// Define the route type
type PlayerScreenRouteProp = RouteProp<RootStackParamList, 'Player'>;

const PlayerPage = () => {
  const [playlistvisible, setplaylistvisible] = useState(false);
  const [createplaylist, setcreateplaylist] = useState(false);
  const progress = useProgress();
  const [loading, setloading] = useState(true);
  const [repeat, setrepeat] = useState(false);
  const [duration, setduration] = useState<number | undefined>(0);
  const [title, settitle] = useState<string | undefined>('');
  const [author, setauthor] = useState<string | undefined>('');
  const route = useRoute<PlayerScreenRouteProp>();
  const [isSliding, setIsSliding] = useState(false);
  const {defaulturl, defaulttitle, defaultpause, where} = route.params;
  const [pause, setpause] = useState(defaultpause);
  const [thumbnail, setthumbnail] = useState<string | undefined>(defaulturl);
  const [visible, setVisible] = useState(false);
  const [id, setid] = useState('');
  const [albumid, setalbumid] = useState('');
  const [artistid, setartistid] = useState('');
  const [plays, setplays] = useState('');
  const storage = new MMKV();
  const [fav, setfav] = useState(0);
  const [modalvisible, setmodalvisible] = useState(false);
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  const [fetchstring, setfetchstring] = useState('');
  const [showplaylist, setshowplaylist] = useState(false);
  const navigation = useNavigation();
  const [successvisible, setsuccessvisible] = useState(false);
  const [successmsg, setsuccessmsg] = useState('');
  const [downloadurl, setdownloadurl] = useState<string | undefined>('');
  const [isdownloaded, setisdownloaded] = useState(false);
  const [downloadloading, setdownloadloading] = useState(false);

  useEffect(() => {
    const handleChange = ({window}: {window: any}) => {
      setDimensions(window);
    };

    const subscription = Dimensions.addEventListener('change', handleChange);

    return () => {
      subscription?.remove();
    };
  }, []);

  const setRepeatToCurrentTrack = async () => {
    await TrackPlayer.setRepeatMode(RepeatMode.Track);
  };

  const setRepeatToqueueTrack = async () => {
    await TrackPlayer.setRepeatMode(RepeatMode.Off);
  };

  useEffect(() => {
    const fetchRepeatMode = async () => {
      const repeatMode = await TrackPlayer.getRepeatMode();
      setrepeat(repeatMode === RepeatMode.Track);
    };

    fetchRepeatMode();
  }, []);

  const getfav = (fid: string) => {
    let myArray = [];
    const jsonString = storage.getString('favorite1');
    if (jsonString) {
      try {
        // Convert JSON string back to array
        myArray = JSON.parse(jsonString);
      } catch (e) {
        console.error('Error parsing JSON string from MMKV', e);
      }
    }
    let found = 0;
    for (let i = 0; i < myArray.length; i++) {
      if (myArray[i].id === fid) {
        setfav(2);
        found = 1;
        break;
      }
    }
    if (found !== 1) {
      setfav(1);
    }
  };

  useEffect(() => {
    if (fav !== 0) setloading(false);
  }, [fav]);

  useEffect(() => {
    const backAction = () => {
      if (showplaylist) {
        setshowplaylist(false);
        return true;
      }
      if (visible) {
        setVisible(false);
        setplaylistvisible(false);
        setcreateplaylist(false);
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, [visible, showplaylist]);

  const handlePressOutside = () => {
    if (visible) {
      setVisible(false);
      setplaylistvisible(false);
      setcreateplaylist(false);
    }
  };

  const handlefav = () => {
    if (
      id === '' &&
      author === '' &&
      title === '' &&
      thumbnail === '' &&
      artistid === '' &&
      albumid === '' &&
      plays === '' &&
      duration === 0
    ) {
      return;
    }
    if (fav === 2) {
      let myArray = [];
      const jsonString = storage.getString('favorite1');
      if (jsonString) {
        try {
          // Convert JSON string back to array
          myArray = JSON.parse(jsonString);
        } catch (e) {
          console.error('Error parsing JSON string from MMKV', e);
        }
      }
      let pos;
      let f = 0;
      for (let i = 0; i < myArray.length; i++) {
        if (myArray[i].id === id) {
          f = 1;
          pos = i;
        }
      }
      myArray.splice(pos, 1);
      const updatedJsonString = JSON.stringify(myArray);

      storage.set('favorite1', updatedJsonString);
      setfav(1);
    } else if (fav === 1) {
      let myArray = [];
      const jsonString = storage.getString('favorite1');
      if (jsonString) {
        try {
          // Convert JSON string back to array
          myArray = JSON.parse(jsonString);
        } catch (e) {
          console.error('Error parsing JSON string from MMKV', e);
        }
      }

      const obj = {
        artist: author,
        title: title,
        id: id,
        thumbnail: thumbnail,
        artistid: artistid,
        albumid: albumid,
        plays: plays,
        url: ``,
        duration: duration,
      };

      myArray.unshift(obj);
      const updatedJsonString = JSON.stringify(myArray);

      storage.set('favorite1', updatedJsonString);
      setfav(2);
    }
  };
  const handlebackward = async (fromtype: string) => {
    setthumbnail('https:lolol.gif');
    settitle('loading');
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

      for (let i = 0; i < myArray.length; i++) {
        if (myArray[i].id === id) {
          const prevIndex = (i - 1 + myArray.length) % myArray.length;
          const checker = checkifdownloaded(myArray[prevIndex].id);
          if (checker === null) {
            const url = `https://yt-api.p.rapidapi.com/dl?id=${myArray[prevIndex].id}`;
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

            await TrackPlayer.add({
              id: myArray[prevIndex].id,
              url: data!.adaptiveFormats[data!.adaptiveFormats.length - 1].url,
              title: myArray[prevIndex].title,
              artist: myArray[prevIndex].artist,
              artistid: myArray[prevIndex].artistid,
              albumid: myArray[prevIndex].albumid,
              plays: myArray[prevIndex].plays,
              artwork: myArray[prevIndex].thumbnail,
              duration: myArray[prevIndex].duration,
              fromtype: fromtype,
            });
          } else {
            await TrackPlayer.add({
              id: checker.id,
              url: checker.url,
              title: checker.title,
              artist: checker.artist,
              artistid: checker.artistid,
              albumid: checker.albumid,
              plays: checker.plays,
              artwork: checker.thumbnail,
              duration: checker.duration,
              fromtype: fromtype,
            });
          }
          break;
        }
      }
      await TrackPlayer.play();
    } catch (error) {
      console.error('Error playing music:', error);
    }
  };

  const checkifdownloaded = (id: string) => {
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
      if (myArray[i].id === id) {
        return myArray[i];
      }
    }
    return null;
  };

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

      for (let i = 0; i < myArray.length; i++) {
        if (myArray[i].id === id) {
          const prevIndex = (i + 1 + myArray.length) % myArray.length;
          const checker = checkifdownloaded(myArray[prevIndex].id);
          if (checker === null) {
            const url = `https://yt-api.p.rapidapi.com/dl?id=${myArray[prevIndex].id}`;
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

            await TrackPlayer.add({
              id: myArray[prevIndex].id,
              url: data!.adaptiveFormats[data!.adaptiveFormats.length - 1].url,
              title: myArray[prevIndex].title,
              artist: myArray[prevIndex].artist,
              artistid: myArray[prevIndex].artistid,
              albumid: myArray[prevIndex].albumid,
              plays: myArray[prevIndex].plays,
              artwork: myArray[prevIndex].thumbnail,
              duration: myArray[prevIndex].duration,
              fromtype: fromtype,
            });
          } else {
            await TrackPlayer.add({
              id: checker.id,
              url: checker.url,
              title: checker.title,
              artist: checker.artist,
              artistid: checker.artistid,
              albumid: checker.albumid,
              plays: checker.plays,
              artwork: checker.thumbnail,
              duration: checker.duration,
              fromtype: fromtype,
            });
          }
          break;
        }
      }
      await TrackPlayer.play();
    } catch (error) {
      console.error('Error playing music:', error);
    }
  };

  useEffect(() => {
    const onTrackChange = TrackPlayer.addEventListener(
      Event.PlaybackActiveTrackChanged,
      async () => {
        const currentTrack = await TrackPlayer.getActiveTrack();

        if (currentTrack?.id !== undefined) {
          setauthor(currentTrack?.artist);
          settitle(currentTrack?.title);
          if (currentTrack?.artwork) setthumbnail(currentTrack?.artwork);
          setduration(currentTrack?.duration);
          setid(currentTrack?.id);
          setalbumid(currentTrack?.albumid);
          setartistid(currentTrack?.artistid);
          setplays(currentTrack?.plays);
          setfetchstring(currentTrack?.fromtype);
          setdownloadurl(currentTrack?.url);
          setpause(false);
          getfav(currentTrack?.id);
        }
      },
    );

    return () => {
      onTrackChange.remove();
    };
  }, []);

  useEffect(() => {
    const onStateChange = TrackPlayer.addEventListener(
      Event.PlaybackState,
      async () => {
        const currentTrack = await TrackPlayer.getPlaybackState();
        if (currentTrack.state === 'ended') handleforward(id, fetchstring);
        if (currentTrack.state === State.Playing) {
          setpause(false);
        } else if (currentTrack.state === State.Paused) {
          setpause(true);
        }
      },
    );

    return () => {
      onStateChange.remove();
    };
  }, [id]);

  const handleSeek = async (value: number) => {
    TrackPlayer.seekTo(value);
  };

  useEffect(() => {
    const getts = async () => {
      const currentTrack = await TrackPlayer.getActiveTrack();
      setauthor(currentTrack?.artist);
      settitle(currentTrack?.title);
      if (currentTrack?.title === defaulttitle)
        setthumbnail(currentTrack?.artwork);
      setduration(currentTrack?.duration);
      setid(currentTrack?.id);
      setalbumid(currentTrack?.albumid);
      setartistid(currentTrack?.artistid);
      setplays(currentTrack?.plays);
      setfetchstring(currentTrack?.fromtype);
      setdownloadurl(currentTrack?.url);
      getfav(currentTrack?.id);
    };
    if (where === 'home') getts();
  }, []);

  const handlerepeat = () => {
    if (repeat === false) {
      setRepeatToCurrentTrack();
      setrepeat(true);
    } else {
      setRepeatToqueueTrack();
      setrepeat(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (successvisible) {
        setTimeout(() => {
          setsuccessvisible(false);
        }, 1500);
      }
    }, [successvisible]),
  );

  useEffect(() => {
    setdownloadloading(false);
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
      if (myArray[i].id === id) {
        setisdownloaded(true);
        return;
      }
    }

    const jsonString2 = storage.getString('downloadbuffer');
    let myArray2 = [];

    if (jsonString2) {
      try {
        // Convert JSON string back to array
        myArray2 = JSON.parse(jsonString2);
      } catch (e) {
        console.error('Error parsing JSON string from MMKV', e);
      }
    }
    for (let i = 0; i < myArray2.length; i++) {
      if (myArray2[i] === id) {
        setdownloadloading(true);
        return;
      }
    }

    setisdownloaded(false);
  }, [id]);

  const downloadsong = async (
    id: string,
    url: string | undefined,
    title: string | undefined,
  ) => {
    if (url) {
      const fileName = id;
      const destinationPath = `${RNFS.DocumentDirectoryPath}/${fileName}.mp3`;
      try {
        const downloadResult = await RNFS.downloadFile({
          fromUrl: url,
          toFile: destinationPath,
        }).promise;

        if (downloadResult.statusCode === 200) {
          setdownloadloading(false);
          setisdownloaded(true);
          return destinationPath;
        } else {
          console.log('File download failed:', downloadResult.statusCode);
          setdownloadloading(false);
          return null;
        }
      } catch (error) {
        console.log('File download error:', error);
        setdownloadloading(false);
        return null;
      }
    }
  };

  const handledownload = async (
    id: string,
    url: string | undefined,
    title: string | undefined,
    author: string | undefined,
    thumbnail: string | undefined,
    albumid: string | undefined,
    artistid: string | undefined,
    plays: string | undefined,
    duration: number | undefined,
  ) => {
    setdownloadloading(true);

    const jsonString2 = storage.getString('downloadbuffer');
    let myArray2 = [];

    if (jsonString2) {
      try {
        // Convert JSON string back to array
        myArray2 = JSON.parse(jsonString2);
      } catch (e) {
        console.error('Error parsing JSON string from MMKV', e);
      }
    }
    myArray2.unshift(id);

    const updatedJsonString2 = JSON.stringify(myArray2);

    storage.set('downloadbuffer', updatedJsonString2);

    const path = await downloadsong(id, url, title);

    const jsonString3 = storage.getString('downloadbuffer');
    let myArray3 = [];

    if (jsonString3) {
      try {
        // Convert JSON string back to array
        myArray3 = JSON.parse(jsonString3);
      } catch (e) {
        console.error('Error parsing JSON string from MMKV', e);
      }
    }
    let found = 0;
    let pos = 0;

    for (let i = 0; i < myArray3.length; i++) {
      if (myArray3[i] === id) {
        pos = i;
        found = 1;
      }
    }

    if (found === 1) {
      myArray3.splice(pos, 1);
      const updatedJsonString3 = JSON.stringify(myArray3);

      storage.set('downloadbuffer', updatedJsonString3);
    }
    if (path !== null) {
      const obj = {
        id: id,
        url: path,
        title: title,
        artist: author,
        artistid: artistid,
        albumid: albumid,
        plays: plays,
        thumbnail: thumbnail,
        duration: duration,
      };
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
      myArray.unshift(obj);
      const updatedJsonString = JSON.stringify(myArray);

      storage.set('downloads', updatedJsonString);
    }
  };

  return (
    <>
      <TouchableWithoutFeedback onPress={handlePressOutside}>
        <View className="h-full w-full bg-black flex flex-col justify-center">
          {
            <Pressable
              className={`absolute flex flex-row ${
                dimensions.width > dimensions.height
                  ? 'justify-end ml-3'
                  : 'justify-center'
              } self-center border w-full p-6`}
              style={{
                left: 0,
                top: 10,
              }}
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
          }
          {modalvisible ? (
            <View
              className="absolute top-0 left-0 w-screen h-screen justify-center items-center  z-10"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
              }}>
              <View className="w-fit h-fit bg-black flex flex-col justify-center items-center p-5 rounded-lg mb-6 mr-5  ">
                <Text className="text-white text-xl mb-3 ">
                  Playlist already exists
                </Text>

                <Pressable
                  className="border-2 border-white mt-5 p-1 px-4  rounded-md "
                  onPress={() => {
                    setmodalvisible(false);
                  }}>
                  <Text className="text-white font-bold text-lg">OK</Text>
                </Pressable>
              </View>
            </View>
          ) : null}
          <View
            style={{
              position: 'absolute',
              height: '100%',
              width: '100%',
              backgroundColor: `rgba(0, 0, 0, ${
                visible || successvisible ? '0.8' : '0'
              })`,
              zIndex: createplaylist ? 29 : 3,
              pointerEvents: 'none',
            }}
          />
          <View
            style={{
              width: dimensions.width,
            }}
            className={`${
              dimensions.width > dimensions.height
                ? 'flex flex-row items-center mb-8 justify-start h-full w-full'
                : 'flex flex-col'
            }`}>
            <View
              className={`border self-center border-gray-500 rounded-xl ${
                dimensions.width > dimensions.height
                  ? 'h-56 w-56 mb-5 mx-auto'
                  : 'h-80 w-80'
              }`}>
              <ImageBackground source={require('../public/icons/4dots.gif')}>
                <Image
                  className="h-full w-full rounded-xl"
                  source={{uri: thumbnail}}
                />
              </ImageBackground>
            </View>

            <View className=" w-fit h-fit ">
              <Text
                className={`ml-3 text-white text-center ${
                  title && title?.length > 35
                    ? 'text-xl'
                    : title && title?.length > 25
                    ? 'text-2xl'
                    : 'text-3xl'
                } ${
                  dimensions.width > dimensions.height
                    ? 'mt-16 mb-1'
                    : 'mt-10 mb-4'
                } `}>
                {title}
              </Text>
              <Text
                className={`ml-3 text-gray-400 text-center mb-2 ${
                  author && author?.length > 35
                    ? 'text-xs'
                    : author && author?.length > 25
                    ? 'text-sm'
                    : 'text-base'
                } `}>
                {author}
              </Text>

              <View className="flex flex-row justify-center w-fit  ">
                <Slider
                  containerStyle={
                    dimensions.width > dimensions.height
                      ? {width: '66%'}
                      : {width: '82%'}
                  }
                  animationType="timing"
                  value={progress.position}
                  onValueChange={value => handleSeek(value[0])}
                  minimumValue={0}
                  maximumValue={progress.duration}
                  thumbTintColor={`${!isSliding ? 'transparent' : 'white'}`}
                  minimumTrackTintColor="#FFFFFF"
                  maximumTrackTintColor="gray"
                  onSlidingStart={() => setIsSliding(true)}
                  onSlidingComplete={() => setIsSliding(false)}
                  trackRightPadding={0}
                  step={1}
                />
              </View>
              <View className="flex flex-row justify-between mx-10">
                <Text className="text-white">
                  {Math.floor(progress.position / 60)}:
                  {Math.floor(progress.position % 60)
                    .toString()
                    .padStart(2, '0')}
                </Text>
                <Text className="text-white">
                  {Math.floor(progress.duration / 60)}:
                  {Math.floor(progress.duration % 60)
                    .toString()
                    .padStart(2, '0')}
                </Text>
              </View>
              <View
                className={`flex flex-row  justify-between mx-8  ${
                  dimensions.width > dimensions.height ? 'mt-2' : 'mt-8'
                } items-center`}>
                <TouchableHighlight
                  className="p-3 "
                  onPress={() => handlefav()}>
                  {!loading ? (
                    <Image
                      tintColor={'#D5003A'}
                      className="h-6 w-6"
                      source={
                        fav === 1
                          ? require('../public/icons/heart.png')
                          : require('../public/icons/heart2.png')
                      }
                    />
                  ) : (
                    <Image
                      tintColor={'black'}
                      className="h-6 w-6"
                      source={require('../public/icons/heart.png')}
                    />
                  )}
                </TouchableHighlight>
                <TouchableHighlight
                  underlayColor={'white'}
                  className="p-3 mr-3  "
                  onPress={() => {
                    handlebackward(fetchstring);
                  }}>
                  <Image
                    tintColor={'#C1C1C1'}
                    className="h-6 w-6"
                    source={require('../public/icons/previous.png')}
                  />
                </TouchableHighlight>

                <TouchableHighlight
                  className="p-3 rounded-lg  "
                  onPress={() => {
                    if (pause) {
                      TrackPlayer.play();
                    } else {
                      TrackPlayer.pause();
                    }
                  }}>
                  <Image
                    tintColor={'#C1C1C1'}
                    className="h-7 w-7"
                    source={
                      !pause
                        ? require('../public/icons/pause.png')
                        : require('../public/icons/play-buttton.png')
                    }
                  />
                </TouchableHighlight>

                <TouchableHighlight
                  underlayColor={'white'}
                  className="p-3 "
                  onPress={() => {
                    handleforward(id, fetchstring);
                  }}>
                  <Image
                    tintColor={'#C1C1C1'}
                    className="h-6 w-6"
                    source={require('../public/icons/next.png')}
                  />
                </TouchableHighlight>
                <TouchableHighlight
                  className="p-3  "
                  onPress={() => {
                    handlerepeat();
                  }}>
                  <Image
                    tintColor={'#C1C1C1'}
                    className="h-7 w-7"
                    source={
                      !repeat
                        ? require('../public/icons/loop.png')
                        : require('../public/icons/loop2.png')
                    }
                  />
                </TouchableHighlight>
              </View>
            </View>
          </View>
          {visible ? (
            <OptionsModal
              thumbnail={thumbnail}
              defaulttitle={defaulttitle}
              author={author}
              handlemodal={setplaylistvisible}
            />
          ) : null}
          {playlistvisible ? (
            <PlayListModal
              handlecreate={setcreateplaylist}
              id={id}
              artist={author}
              thumbnail={thumbnail}
              title={title}
              duration={duration}
              handleplaylist={setplaylistvisible}
              handleoptions={setVisible}
              handlesuccess={setsuccessvisible}
              handlesuccessmsg={setsuccessmsg}
            />
          ) : null}
          {createplaylist ? (
            <CreatePlayListModal
              handlecreate={setcreateplaylist}
              handleplaylist={setplaylistvisible}
              handleoptions={setVisible}
              handlemodalvisible={setmodalvisible}
              id={id}
              artist={author}
              thumbnail={thumbnail}
              title={title}
              duration={duration}
              handlesuccess={setsuccessvisible}
              handlesuccessmsg={setsuccessmsg}
            />
          ) : null}
          {successvisible ? (
            <View
              className="flex flex-col justify-center items-center p-4 border w-full border-white rounded-2xl"
              style={{
                position: 'absolute',
                top: '40%',

                backgroundColor: '#1E1E1E',
                zIndex: 30,

                height: 100,
              }}>
              <Text className="text-white text-lg">{successmsg}</Text>
            </View>
          ) : null}
          <View className="absolute bottom-0 w-full   flex flex-row justify-between">
            <Pressable
              className="ml-4 -mr-3.5 p-3 self-center  "
              onPress={() => {
                if (!isdownloaded && !downloadloading) {
                  handledownload(
                    id,
                    downloadurl,
                    title,
                    author,
                    thumbnail,
                    albumid,
                    artistid,
                    plays,
                    duration,
                  );
                }
              }}>
              {!loading ? (
                <Image
                  tintColor={'#C1C1C1'}
                  className="h-5 w-5 "
                  source={
                    downloadloading
                      ? require('../public/icons/4dots.gif')
                      : isdownloaded
                      ? require('../public/icons/checked.png')
                      : require('../public/icons/downloads.png')
                  }
                />
              ) : (
                <Image
                  tintColor={'#000000'}
                  className="h-5 w-5 "
                  source={
                    downloadloading
                      ? require('../public/icons/4dots.gif')
                      : isdownloaded
                      ? require('../public/icons/checked.png')
                      : require('../public/icons/downloads.png')
                  }
                />
              )}
            </Pressable>
            <Pressable
              className="self-center ml-8 p-4 "
              onPress={() => {
                const pushAction = StackActions.push('PlayerPlaylist', {
                  fetchtype: {fetchstring},
                  current: {id},
                });
                navigation.dispatch(pushAction);
              }}>
              <Image
                tintColor={'#C1C1C1'}
                className="h-6 w-6"
                source={require('../public/icons/openplaylist.png')}
              />
            </Pressable>

            <Pressable
              className="  self-center mr-5 p-3"
              onPress={() => {
                setVisible(true);
              }}>
              <Image
                tintColor={'#C1C1C1'}
                className="h-6 w-6 "
                source={require('../public/icons/option.png')}
              />
            </Pressable>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </>
  );
};

export default memo(PlayerPage);
