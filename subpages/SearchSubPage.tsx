import {
  View,
  Text,
  TextInput,
  Image,
  FlatList,
  Dimensions,
  ScrollView,
  Pressable,
  BackHandler,
} from 'react-native';
import React, {memo, useCallback, useEffect, useState} from 'react';
import SongCard from '../components/SongCard';
import 'event-target-polyfill';
import 'web-streams-polyfill';
import 'text-encoding-polyfill';
import 'react-native-url-polyfill/auto';
import Innertube from 'youtubei.js';

//AIzaSyDTI8s_USJq4SxFGRLZoTcdrZfgP5RvO-c
import Search, {
  SearchContinuation,
} from 'd:/ymusic/ymusic/node_modules/youtubei.js/dist/src/parser/ytmusic/Search';
import {MMKV} from 'react-native-mmkv';
import {useFocusEffect} from '@react-navigation/native';

function truncateText(text: string) {
  if (text.length > 18) {
    return text.slice(0, 18) + '...';
  } else {
    return text;
  }
}

const SearchSubPage = () => {
  const storage = new MMKV();
  const [submit, setsubmit] = useState(false);
  const [searchhistory, setsearchhistory] = useState([]);
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  const [search, setsearch] = useState<Search>();
  const [cont, setcont] = useState<SearchContinuation | undefined>();
  const [results, setresults] = useState<any[] | undefined>([]);
  const [text, setText] = useState('');

  useEffect(() => {
    const handleChange = ({window}: {window: any}) => {
      setDimensions(window);
    };

    const subscription = Dimensions.addEventListener('change', handleChange);

    return () => {
      subscription?.remove();
    };
  }, []);

  const intitalizeinnertube = async (stext: string) => {
    const tube = await Innertube.create();
    const data = await tube.music.search(stext, {type: 'song'});
    setsearch(data);

    if (data.contents && data.contents[0].type === 'MusicShelf')
      setresults(data.contents[0].contents);
    else if (data.contents && data.contents[1].type === 'MusicShelf')
      setresults(data.contents[1].contents);
  };

  const handleSearch = (stext: string) => {
    setsearch(undefined);
    setresults([]);
    setsubmit(true);
    const jsonString = storage.getString('searchhistory2');
    let myArray = [];

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
      if (myArray[i] === text) {
        found = 1;
      }
    }
    if (found === 0 && text !== '') {
      myArray.unshift(text);
    }
    const updatedJsonString = JSON.stringify(myArray);

    storage.set('searchhistory2', updatedJsonString);
    intitalizeinnertube(stext);
  };

  const getsearchhistory = async () => {
    const jsonString = storage.getString('searchhistory2');
    let myArray = [];

    if (jsonString) {
      try {
        // Convert JSON string back to array
        myArray = JSON.parse(jsonString);
      } catch (e) {
        console.error('Error parsing JSON string from MMKV', e);
      }
    }
    setsearchhistory(myArray);
  };

  useFocusEffect(
    useCallback(() => {
      const backAction = () => {
        if (submit) {
          setsubmit(false);
          setText('');
          setresults([]);
          getsearchhistory();
          return true;
        }
        return false;
      };

      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        backAction,
      );

      return () => backHandler.remove(); // Clean up the event listener on unmount
    }, [submit]),
  );

  useEffect(() => {
    getsearchhistory();
  }, []);

  const fetchmore = async () => {
    let newdata;
    if (cont === undefined) {
      newdata = await search?.getContinuation();
    } else {
      newdata = await cont?.getContinuation();
    }

    if (
      newdata &&
      newdata.contents &&
      Array.isArray(newdata.contents.contents)
    ) {
      setcont(newdata);
      setresults([...(results || []), ...newdata.contents.contents]);
    } else {
      console.error(
        'newdata or newdata.contents or newdata.contents.contents is undefined or not an array',
      );
    }
  };

  return (
    <>
      <View className="flex flex-col ">
        <View
          className="mt-2 flex flex-row justify-between pr-3 "
          style={{
            width: '95%',
          }}>
          {submit ? (
            <Pressable
              onPress={() => {
                setsubmit(false);
                setText('');
                setresults([]);
                getsearchhistory();
              }}
              className=" z-50 w-10 h-10 self-center">
              <Image
                className="h-7 w-7 self-center mt-1"
                tintColor={'gray'}
                source={require('../public/icons/back.png')}
              />
            </Pressable>
          ) : (
            <View></View>
          )}
          <TextInput
            className=" rounded-xl h-20 text-4xl text-white"
            placeholder="Search..."
            placeholderTextColor={'gray'}
            onChangeText={newText => setText(newText)}
            defaultValue={text}
            style={{textAlign: 'right'}}
            returnKeyType="search"
            onSubmitEditing={() => handleSearch(text)}
          />
        </View>
        {submit ? (
          <View className="mb-60">
            {results?.length !== 0 ? (
              <FlatList
                contentContainerStyle={{
                  paddingBottom: 200,
                }}
                data={results}
                renderItem={({item}) => {
                  return (
                    <SongCard
                      title={item.title}
                      id={item.id}
                      artist={
                        item.artists && item.artists[0]
                          ? item.artists[0].name
                          : 'null'
                      }
                      duration={item.duration.seconds}
                      plays={item.flex_columns[2].title.text}
                      albumid={item.album ? item.album.id : 'noalbum'}
                      url={item.thumbnail.contents[0].url}
                      hdurl={
                        item.thumbnail.contents[1]
                          ? item.thumbnail.contents[1].url
                          : item.thumbnail.contents[0].url
                      }
                    />
                  );
                }}
                keyExtractor={(item, index) => item?.id + index}
                ListFooterComponent={
                  <View className="self-center flex flex-col justify-center">
                    <Image
                      className="h-20 w-20 self-center"
                      source={require('../public/icons/pikachu2.gif')}
                    />
                    <Text className="text-white self-center text-xl text-center">
                      Fetching more...
                    </Text>
                  </View>
                }
                onEndReached={() => {
                  fetchmore();
                }}
                onEndReachedThreshold={0.5}
              />
            ) : (
              <View className="self-center">
                <Image
                  className="h-44 w-44"
                  source={require('../public/icons/pikachu2.gif')}
                />
                <Text className="text-white text-xl text-center">
                  Loading data
                </Text>
              </View>
            )}
          </View>
        ) : (
          <ScrollView
            className="flex flex-col"
            contentContainerStyle={{
              paddingBottom: 340,
            }}>
            {searchhistory.length !== 0
              ? searchhistory.map((item, index) => {
                  return (
                    <Pressable
                      onPress={() => {
                        setText(item);
                        handleSearch(item);
                      }}
                      className=" self-end mr-9 flex flex-row justify-between my-2 p-2"
                      style={{
                        width: '87%',
                      }}
                      key={index}>
                      <Image
                        className="h-6 w-6 self-center ml-4"
                        tintColor={'gray'}
                        source={require('../public/icons/history.png')}
                      />
                      <Text className="text-gray-500 text-xl ">
                        {truncateText(item)}
                      </Text>
                    </Pressable>
                  );
                })
              : null}
          </ScrollView>
        )}
      </View>
    </>
  );
};

export default memo(SearchSubPage);
