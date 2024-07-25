import {
  View,
  Text,
  Pressable,
  ScrollView,
  Image,
  BackHandler,
  FlatList,
  TextInput,
  Dimensions,
} from 'react-native';
import React, {memo, useEffect, useState} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import {useCallback} from 'react';

import {MMKV} from 'react-native-mmkv';
import PlaylistCard from '../components/PlaylistCard';

type itemtype = {
  title: string;
  id: string;
  artist: string;
  duration: number;
  plays: string;
  albumid: string;
  thumbnail: string;
};

const PlaylistsSubPage = () => {
  const storage = new MMKV();
  const [enter, setenter] = useState(false);
  const [isfav, setisfav] = useState(false);
  const [current, setcurrent] = useState('');
  const [currentname, setcurrentname] = useState('');
  const [favlength, setfavlength] = useState(0);
  const [downlength, setdownlength] = useState(0);
  const [mainarray, setmainarray] = useState([]);
  const [thumbnailarray, setthumbnailarray] = useState<string[][]>([]);
  const [data, setdata] = useState([]);
  const [results, setresults] = useState([]);
  const [visible, setvisible] = useState(false);
  const [text, settext] = useState('');
  const [modalvisible, setmodalvisible] = useState(false);
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  const [deletemodal, setdeletemodal] = useState(false);
  const [deletemodaltext, setdeletemodaltext] = useState('');
  const [deletemodalid, setdeletemodalid] = useState('');

  const renderItem = ({item}: {item: itemtype}) => (
    <PlaylistCard
      title={item.title}
      id={item.id}
      artist={item.artist}
      duration={item.duration}
      albumid={item.albumid}
      plays={item.plays} // assuming this was meant to be plays instead of duration again
      url={item.thumbnail}
      hdurl={item.thumbnail}
      playlistid={current}
    />
  );

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
    const jsonString = storage.getString('favorite1');
    let myArray = [];
    if (jsonString) {
      try {
        // Convert JSON string back to array
        myArray = JSON.parse(jsonString);
      } catch (e) {
        console.error('Error parsing JSON string from MMKV', e);
      }
    }
    setresults(myArray);
  }, []);

  useEffect(() => {}, [enter]);

  useFocusEffect(
    useCallback(() => {
      const jsonString = storage.getString('playlist4');
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
    }, [visible, deletemodal]),
  );

  useEffect(() => {
    let myArray = [];
    const jsonString = storage.getString(current);
    if (jsonString) {
      try {
        // Convert JSON string back to array
        myArray = JSON.parse(jsonString);
      } catch (e) {
        console.error('Error parsing JSON string from MMKV', e);
      }
    }
    setdata(myArray);
  }, [current]);

  useFocusEffect(
    useCallback(() => {
      let newarr: string[][] = [];
      mainarray.forEach((item: {id: string}) => {
        const jsonString = storage.getString(item.id);
        let thumbnails: string[] = [];
        let myArray = [];
        if (jsonString) {
          try {
            // Convert JSON string back to array
            myArray = JSON.parse(jsonString);
          } catch (e) {
            console.error('Error parsing JSON string from MMKV', e);
          }
        }
        myArray.forEach((element: {thumbnail: string}) => {
          thumbnails.push(element.thumbnail);
        });
        newarr.push(thumbnails);
      });
      setthumbnailarray(newarr);
    }, [mainarray]),
  );

  const handlepress = (ifd: string, iname: string) => {
    setenter(true);
    setcurrent(ifd);
    setcurrentname(iname);
  };

  const addnewplaylist = (text: string) => {
    const jsonString = storage.getString('playlist4');
    let myArray = [];
    if (jsonString) {
      try {
        // Convert JSON string back to array
        myArray = JSON.parse(jsonString);
      } catch (e) {
        console.error('Error parsing JSON string from MMKV', e);
      }
    }
    if (text === '') {
      setvisible(false);
      setmodalvisible(true);
      return;
    }
    for (let i = 0; i < myArray.length; i++) {
      if (myArray[i].name === text) {
        setvisible(false);
        setmodalvisible(true);
        return;
      }
    }

    const obj = {
      name: text,
      id: `playlistid${myArray.length + 1}`,
    };
    myArray.unshift(obj);
    const updatedJsonString = JSON.stringify(myArray);

    storage.set('playlist4', updatedJsonString);
  };

  const deleteplaylist = () => {
    const jsonString = storage.getString('playlist4');
    let myArray = [];
    if (jsonString) {
      try {
        // Convert JSON string back to array
        myArray = JSON.parse(jsonString);
      } catch (e) {
        console.error('Error parsing JSON string from MMKV', e);
      }
    }
    let pos;
    let found = 0;
    for (let i = 0; i < myArray.length; i++) {
      if (myArray[i].name === deletemodaltext) {
        pos = i;
        found = 1;
        break;
      }
    }

    myArray.splice(pos, 1);
    const updatedJsonString = JSON.stringify(myArray);
    storage.set('playlist4', updatedJsonString);

    const updatedJsonString2 = JSON.stringify([]);
    storage.set(deletemodalid, updatedJsonString2);
  };

  useFocusEffect(
    useCallback(() => {
      const backAction = () => {
        if (visible) {
          setvisible(false);
          return true;
        }
        if (deletemodal) {
          setdeletemodal(false);
          return true;
        }
        if (enter) {
          if (isfav) setisfav(false);
          setenter(false);
          return true;
        }
        return false;
      };

      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        backAction,
      );

      return () => backHandler.remove();
    }, [enter, visible, deletemodal]),
  );

  useFocusEffect(
    useCallback(() => {
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
      setfavlength(myArray.length);

      let myArray2 = [];
      const jsonString2 = storage.getString('downloads');
      if (jsonString2) {
        try {
          // Convert JSON string back to array
          myArray2 = JSON.parse(jsonString2);
        } catch (e) {
          console.error('Error parsing JSON string from MMKV', e);
        }
      }
      setdownlength(myArray2.length);

      return () => {};
    }, []),
  );

  const handlefavpress = () => {
    setenter(true);
    handlepress('favorite1', 'Favorites');
  };

  const handledownloadpress = () => {
    handlepress('downloads', 'Downloads');
  };

  return (
    <>
      {deletemodal ? (
        <View
          className="absolute top-0 left-0 w-full h-full justify-center items-center   z-10"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
          }}>
          <View className="w-fit h-fit bg-black flex flex-col justify-center items-center p-5 rounded-lg  mr-5 border border-white">
            <Text className="text-white text-xl mb-3 font-bold text-center ">
              Do you wish to delete Playlist '{deletemodaltext}'
            </Text>

            <View className="flex flex-col">
              <Pressable
                className="border-2 border-white mt-5 mb-3 p-1 px-4 self-center rounded-md "
                onPress={() => {
                  deleteplaylist();
                  setdeletemodal(false);
                }}>
                <Text className="text-white text-base">Confirm</Text>
              </Pressable>
              <Pressable
                className="border-2 border-black p-1 px-4 self-center rounded-md "
                onPress={() => {
                  setdeletemodal(false);
                }}>
                <Text className="text-white font-bold text-base">Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}
      {modalvisible ? (
        <View
          className="absolute top-0 left-0 w-full h-full justify-center items-center   z-10"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
          }}>
          <View className="w-fit h-fit bg-black flex flex-col justify-center items-center p-5 rounded-lg mb-6 mr-5 border border-white">
            <Text className="text-white text-xl mb-3 ">
              Invalid Playlist Name
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
      {visible ? (
        <View
          className="absolute top-0 left-0 w-full h-full justify-center items-center   z-10"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
          }}>
          <View className="w-fit h-fit bg-black flex flex-col justify-center items-center p-5 rounded-lg  mr-5 border border-white">
            <Text className="text-white text-base mb-3">
              Enter New Playlist
            </Text>
            <TextInput
              className="rounded-lg px-3 py-2 bg-zinc-800 text-xl h-12 text-white w-44"
              onChangeText={newText => settext(newText)}
            />
            <Pressable
              className="border-2 border-white mt-5 p-1.5 rounded-md "
              onPress={() => {
                addnewplaylist(text);
                setvisible(false);
              }}>
              <Text className="text-white text-lg">Confirm</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
      {!enter ? (
        <View className="flex flex-col ml-2 ">
          <View className="mt-8 ml-3 mb-4 justify-center">
            <Text className="text-white text-3xl">Your Playlists</Text>
          </View>
          <ScrollView
            contentContainerStyle={{
              paddingBottom: 200,
            }}
            showsVerticalScrollIndicator={false}
            className={
              dimensions.width > dimensions.height ? `mb-40` : `mb-56`
            }>
            <View className="flex flex-row flex-wrap">
              <Pressable
                className=" rounded-xl m-4"
                onPress={() => {
                  handlefavpress();
                }}>
                <View
                  className=" flex  flex-row justify-center border border-white rounded-xl"
                  style={{
                    width: 102,
                    height: 102,
                  }}>
                  <Image
                    tintColor={'#D5003A'}
                    className="self-center"
                    style={{
                      width: 30,
                      height: 30,
                    }}
                    source={require('../public/icons/heart2.png')}
                  />
                </View>

                <View className="absolute right-1.5 bottom-9 p-1 w-6 bg-gray-800 rounded-lg">
                  <Text className="text-white self-center">{favlength}</Text>
                </View>
                <Text className="text-white text-center text-xl">
                  Favorites
                </Text>
              </Pressable>
              <Pressable
                className=" rounded-xl m-4"
                onPress={() => {
                  handledownloadpress();
                }}>
                <View
                  className=" flex  flex-row justify-center border border-white rounded-xl"
                  style={{
                    width: 102,
                    height: 102,
                  }}>
                  <Image
                    tintColor={'#009ADD'}
                    className="self-center"
                    style={{
                      transform: [{rotate: '90deg'}],
                      width: 35,
                      height: 35,
                    }}
                    source={require('../public/icons/flight.png')}
                  />
                </View>

                <View className="absolute right-1.5 bottom-9 p-1 w-6 bg-gray-800 rounded-lg">
                  <Text className="text-white self-center">{downlength}</Text>
                </View>
                <Text className="text-white text-center text-xl">Offline</Text>
              </Pressable>

              {mainarray.map((item: any, index: any) => {
                return (
                  <Pressable
                    className=" rounded-xl m-4"
                    key={index}
                    onLongPress={() => {
                      setdeletemodalid(item.id);
                      setdeletemodaltext(item.name);
                      setdeletemodal(true);
                    }}
                    onPress={() => {
                      handlepress(item.id, item.name);
                    }}>
                    {thumbnailarray.length !== 0 && thumbnailarray[index] ? (
                      <View
                        className=" flex flex-wrap flex-row justify-start border border-white rounded-xl"
                        style={{
                          width: 102,
                          height: 102,
                          overflow: 'hidden',
                        }}>
                        {thumbnailarray[index]
                          .slice(0, 4)
                          .map((thumbnail, i) => (
                            <Image
                              key={i}
                              style={{
                                zIndex: -999,
                                width: 50,
                                height: 50,
                              }}
                              source={{uri: thumbnail}}
                            />
                          ))}
                      </View>
                    ) : null}
                    <View className="absolute right-1.5 bottom-9 p-1 w-6 bg-gray-800 rounded-lg">
                      <Text className="text-white self-center">
                        {thumbnailarray[index]
                          ? thumbnailarray[index].length
                          : 0}
                      </Text>
                    </View>
                    <Text className="text-white text-center text-xl">
                      {item.name}
                    </Text>
                  </Pressable>
                );
              })}
              <Pressable
                className="m-4"
                onPress={() => {
                  setvisible(true);
                }}>
                <View
                  className=" flex  flex-row justify-center border border-white rounded-xl"
                  style={{
                    width: 102,
                    height: 102,
                  }}>
                  <Image
                    tintColor={'gray'}
                    className="self-center"
                    style={{
                      width: 50,
                      height: 50,
                    }}
                    source={require('../public/icons/add.png')}
                  />
                </View>

                <Text className="text-white text-center text-sm">
                  Add new Playlist
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      ) : (
        <View className="flex flex-col">
          <View className="mt-5 ml-3 mb-3 justify-between flex p-1 flex-row">
            <Pressable
              onPress={() => {
                setenter(false);
                setcurrent('');
                setcurrentname('');
              }}
              className=" z-50 p-1 self-center">
              <Image
                className="h-6 w-6 self-center"
                tintColor={'gray'}
                source={require('../public/icons/back.png')}
              />
            </Pressable>
            <Text className="text-white text-3xl mt-1 mr-6">{currentname}</Text>
          </View>
          <FlatList
            contentContainerStyle={{paddingTop: 5, paddingRight: 10}}
            style={{height: '80%', width: '100%'}}
            data={data}
            renderItem={renderItem}
            keyExtractor={(item, index) => index.toString()}
          />
        </View>
      )}
    </>
  );
};

export default memo(PlaylistsSubPage);
