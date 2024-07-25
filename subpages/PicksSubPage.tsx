import {
  View,
  Text,
  ScrollView,
  FlatList,
  Image,
  Pressable,
  Dimensions,
  BackHandler,
  ImageBackground,
} from 'react-native';
import React, {memo, useCallback, useEffect, useState} from 'react';
import 'event-target-polyfill';
import 'web-streams-polyfill';
import 'text-encoding-polyfill';
import 'react-native-url-polyfill/auto';
import Innertube from 'youtubei.js';
import {MMKV} from 'react-native-mmkv';
import RecommendationCard from '../components/RecommendationCard';
import {useFocusEffect} from '@react-navigation/native';

function truncatetext2(text: string | undefined) {
  if (text === undefined) return;
  if (text.length > 19) return text.slice(0, 19) + '...';
  else return text;
}

function getListId(url: string) {
  // Create a URL object
  const urlObj = new URL(url);

  // Get the search parameters
  const params = new URLSearchParams(urlObj.search);

  // Get the value of the 'list' parameter
  const listId = params.get('list');

  // Return the list ID
  return listId;
}

function shuffle(array: any[]) {
  let currentIndex = array.length;

  // While there remain elements to shuffle...
  while (currentIndex != 0) {
    // Pick a remaining element...
    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
}

function makechunks(array: any[]) {
  let limit = array.length;
  let newarray = [];
  for (let i = 0; i < limit / 4; i++) {
    let subarray = [];
    for (let j = 0; j < 4; j++) {
      subarray.push(array[4 * i + j]);
    }
    newarray.push(subarray);
  }
  return newarray;
}

const PicksSubPage = () => {
  const storage = new MMKV();
  const [mainarray1, setmainarray1] = useState<any[]>([]);
  const [mainarray2, setmainarray2] = useState<any[]>([]);
  const [mainarray3, setmainarray3] = useState<any[]>([]);
  const [complete, setcomplete] = useState(false);
  const [showartist, setshowartist] = useState(false);
  const [artistimg, setartistimg] = useState('http://jhkjh.lol');
  const [artistdesc, setartistdesc] = useState('');
  const [artistname, setartistname] = useState('');
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  const [artistrecc, setartistrecc] = useState<any[]>([]);
  const [artistalbum, setartistalbum] = useState<any[]>([]);
  const [showalbum, setshowalbum] = useState(false);
  const [mainalbumarray, setmainalbumarray] = useState<any[]>([]);
  const [albumarray, setalbumarray] = useState<any[]>([]);
  const [albumthumbnail, setalbumthumbnail] = useState('http://jhkjh.lol');
  const [albumtitle, setalbumtitle] = useState('');
  const [albumsongs, setalbumsongs] = useState('');
  const [albumidarray, setalbumidarray] = useState<any[]>([]);
  const [albumid, setalbumid] = useState('');
  const [artistalbumshow, setartistalbumshow] = useState(false);
  const [artistalbumsongs, setartistalbumsongs] = useState<any[]>([]);
  const [artistalbumthumbnail, setartistalbumthumbnail] = useState('');
  const [artistalbumtitle, setartistalbumtitle] = useState('');
  const [artistalbumid, setartistalbumid] = useState('');
  const [songsempty, setsongsempty] = useState(false);

  useEffect(() => {
    const handleChange = ({window}: {window: any}) => {
      setDimensions(window);
    };

    const subscription = Dimensions.addEventListener('change', handleChange);

    return () => {
      subscription?.remove();
    };
  }, []);

  const getalbum = async (tube: Innertube, songs: any) => {
    let array: any[] = [];
    let arrayi: any[] = [];
    let limit = songs.length;
    if (limit > 15) limit = 15;
    let albumidarray: any[] = [];

    const albumPromises = songs.slice(0, limit).map((song: any) => {
      if (song.albumid !== 'noalbum' && !albumidarray.includes(song.albumid)) {
        albumidarray.push(song.albumid);
        return tube.music.getAlbum(song.albumid);
      } else {
        return null;
      }
    });

    const albumData = await Promise.all(albumPromises);

    const filteredArray = albumData.filter(element => element !== null);
    arrayi = filteredArray.filter(Boolean).map((d: any) => getListId(d.url));

    const playlistPromises = arrayi.map((id: string) => tube.getPlaylist(id));
    array = await Promise.all(playlistPromises);
    setalbumidarray(albumidarray);
    setmainalbumarray(filteredArray);
    setmainarray3(array);
  };

  const getartists = async (tube: Innertube, songs: any) => {
    let array: any[] = [];
    let limit = songs.length;
    if (limit > 10) limit = 10;
    let d;
    let checker: string | any[] = [];

    for (let i = 0; i < limit; i++) {
      if (!checker.includes(songs[i].artistid)) {
        d = await tube.getChannel(songs[i].artistid);
        array.push([d, songs[i].artistid]);
        checker.push(songs[i].artistid);
      }
    }

    setmainarray2(array);
  };

  const getrecommendation = async (tube: Innertube, songs: any) => {
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

    let array: any[] = [];
    let limit = songs.length;
    if (limit > 8) limit = 8;

    // Create an array of promises
    const promises = songs
      .slice(0, limit)
      .map((song: any) => tube.music.getRelated(song.id));

    // Execute all promises concurrently
    const results = await Promise.all(promises);

    // Process the results
    let count = 0;

    results.forEach((d: any) => {
      count = 0;
      d.contents[0].contents.forEach((element: any) => {
        if (count < 4 && !array.some(item => item.id === element.id)) {
          array.push(element);
          count++;
        }
      });
    });
    shuffle(array);
    setmainarray1(makechunks(array));
  };
  const setup = async () => {
    const tube = await Innertube.create();

    const jsonString = storage.getString('history9');
    let myArray = [];
    if (jsonString) {
      try {
        myArray = JSON.parse(jsonString);
      } catch (e) {
        console.error('Error parsing JSON string from MMKV', e);
      }
    }
    if (myArray.length === 0) setsongsempty(true);
    getrecommendation(tube, myArray);

    getartists(tube, myArray);

    getalbum(tube, myArray);
  };

  const renderItem = ({item}: {item: any}) => (
    <View className="h-96">
      {item.map((inneritem: any, index: any) => {
        return (
          <RecommendationCard
            key={index}
            title={inneritem.title}
            id={inneritem.id}
            artist={
              inneritem.artists && inneritem.artists[0]
                ? inneritem.artists[0].name
                : 'null'
            }
            duration={0}
            albumid={inneritem.album.id}
            plays={'playing'}
            url={inneritem.thumbnail.contents[0].url}
            hdurl={inneritem.thumbnail.contents[1].url}
          />
        );
      })}
    </View>
  );

  const getalbumsongs = async (id: string) => {
    const tube = await Innertube.create();
    const data = await tube.music.getAlbum(id);
    const playlistid = data.url ? getListId(data.url) : '';
    const newdata = playlistid ? await tube.getPlaylist(playlistid) : [];
    setartistalbumsongs(data.contents);
  };

  useFocusEffect(
    useCallback(() => {
      const backAction = () => {
        if (showalbum) {
          setshowalbum(false);
          setalbumthumbnail('http:/sadasd.ll');
          setalbumid('');
          setalbumarray([]);
          setalbumtitle('');
          return true;
        }

        if (showartist) {
          if (artistalbumshow) {
            setartistalbumshow(false);
            setartistalbumsongs([]);
            setartistalbumthumbnail('https://asdasda.asasd');
            setartistalbumtitle('');
            setartistalbumid('');
            return true;
          }
          setshowartist(false);
          setartistalbum([]);
          setartistdesc('');
          setartistimg('http:/sadasd.ll');
          setartistname('Loading');
          setartistrecc([]);

          return true;
        }
        return false;
      };

      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        backAction,
      );

      return () => backHandler.remove();
    }, [showartist, showalbum, artistalbumshow]),
  );

  const truncateText = (text: string) => {
    if (text.length > 27) {
      return text.slice(7).slice(0, 25) + '...';
    } else {
      return text.slice(7);
    }
  };

  useEffect(() => {
    if (
      mainarray3.length !== 0 &&
      mainarray1.length !== 0 &&
      mainarray2.length !== 0
    )
      setcomplete(true);
  }, [mainarray3, mainarray1, mainarray2]);

  const handlepressalbum = async (
    item: any,
    artwork: string,
    title: string,
    albumid: string,
  ) => {
    setshowalbum(true);
    setalbumtitle(title);
    setalbumthumbnail(artwork);
    setalbumarray(item.contents);
    setalbumid(albumid);
  };

  const handlepressartist = async (item: string, thumbnail: string) => {
    setshowartist(true);
    const tube = await Innertube.create();
    let x = await tube.music.getArtist(item);
    setartistimg(thumbnail);

    if (x.header && 'description' in x.header) {
      setartistdesc((x.header as any).description.text);
    }
    if (x.header && x.header.title && x.header.title.text)
      setartistname(x.header.title.text);
    if (x.sections[0].contents) setartistrecc(x.sections[0].contents);

    setartistalbum(x.sections[1].contents);
  };

  useEffect(() => {
    setup();
  }, []);
  return (
    <>
      {showalbum && !showartist ? (
        <>
          <View className="absolute flex flex-row justify-between w-full p-1 mt-5 mb-7">
            <Pressable
              onPress={() => {
                setshowalbum(false);
                setalbumthumbnail('http:/sadasd.ll');
                setalbumid('');
                setalbumarray([]);
                setalbumtitle('');
              }}
              className=" z-50 self-center">
              <Image
                className="h-6 w-6 self-center"
                tintColor={'gray'}
                source={require('../public/icons/back.png')}
              />
            </Pressable>
            <Text className="self-center text-end text-white text-2xl">
              {truncatetext2(albumtitle.slice(7))}
            </Text>
          </View>
          <ScrollView
            className={`mt-20 ml-1.5 p-1 ${
              dimensions.width > dimensions.height ? 'mb-10' : 'mb-24'
            } `}>
            <View className="flex flex-col items-center">
              <View className="w-56 h-56 rounded-2xl">
                <ImageBackground source={require('../public/icons/4dots.gif')}>
                  <Image
                    className="w-full h-full rounded-2xl"
                    source={{uri: albumthumbnail}}
                  />
                </ImageBackground>
              </View>

              <View className="self-center mt-2">
                <Text className="text-center text-white text-lg mb-3">
                  {albumarray.length} Songs
                </Text>
              </View>
              <View className="flex flex-col justify-evenly mx-5 mb-20">
                {albumarray
                  ? albumarray.map((item, index) => {
                      return (
                        <RecommendationCard
                          key={index}
                          title={item.title}
                          id={item.id}
                          artist={item.duration.text}
                          duration={0}
                          albumid={albumid}
                          plays={'playing'}
                          url={albumthumbnail}
                          hdurl={albumthumbnail}
                        />
                      );
                    })
                  : null}
              </View>
            </View>
          </ScrollView>
        </>
      ) : showartist && !showalbum ? (
        artistalbumshow ? (
          <>
            <View className="absolute flex flex-row justify-between w-full p-1 mt-5 mb-7">
              <Pressable
                onPress={() => {
                  setartistalbumshow(false);
                  setartistalbumsongs([]);
                  setartistalbumthumbnail('https://asdasda.asasd');
                  setartistalbumtitle('');
                  setartistalbumid('');
                }}
                className=" z-50 self-center">
                <Image
                  className="h-6 w-6 self-center"
                  tintColor={'gray'}
                  source={require('../public/icons/back.png')}
                />
              </Pressable>
              <Text className="self-center text-end text-white text-2xl mr-3">
                {truncatetext2(artistalbumtitle)}
              </Text>
            </View>
            <ScrollView
              className={`mt-20 ml-1.5 p-1 ${
                dimensions.width > dimensions.height ? 'mb-10' : 'mb-24'
              } `}>
              <View className="flex flex-col items-center ">
                <View className="w-56 h-56 rounded-2xl">
                  <ImageBackground
                    source={require('../public/icons/4dots.gif')}>
                    <Image
                      className="w-full h-full rounded-2xl"
                      source={{uri: artistalbumthumbnail}}
                    />
                  </ImageBackground>
                </View>

                <View className="self-center mt-2">
                  <Text className="text-center text-white text-lg mb-3">
                    {artistalbumsongs.length === 0
                      ? 'Loading Songs'
                      : `${artistalbumsongs.length} Songs`}
                  </Text>
                </View>
                <View className="flex flex-col justify-evenly mx-5 mb-20">
                  {artistalbumsongs ? (
                    artistalbumsongs.map((item, index) => {
                      return (
                        <RecommendationCard
                          key={index}
                          title={item.title}
                          id={item.id}
                          artist={item.duration.text}
                          duration={0}
                          albumid={artistalbumid}
                          plays={'playing'}
                          url={artistalbumthumbnail}
                          hdurl={artistalbumthumbnail}
                        />
                      );
                    })
                  ) : (
                    <>
                      <Image
                        className="self-center mt-10"
                        source={require('../public/icons/pikachu2.gif')}
                      />
                      <Text className="text-white text-xl text-center self-center">
                        Loading
                      </Text>
                    </>
                  )}
                </View>
              </View>
            </ScrollView>
          </>
        ) : (
          <>
            <View className="absolute flex flex-row justify-between w-full mt-5 mb-7 p-1">
              <Pressable
                onPress={() => {
                  setshowartist(false);
                  setartistalbum([]);
                  setartistdesc('');
                  setartistimg('http:/sadasd.ll');
                  setartistname('Loading');
                  setartistrecc([]);
                }}
                className=" z-50  self-center">
                <Image
                  className="h-6 w-6 self-center"
                  tintColor={'gray'}
                  source={require('../public/icons/back.png')}
                />
              </Pressable>
              <Text className="self-center text-end text-white text-2xl mr-3">
                {truncatetext2(artistname)}
              </Text>
            </View>
            <ScrollView
              className={`mt-20 ml-1.5 p-1 ${
                dimensions.width > dimensions.height ? 'mb-10' : 'mb-24'
              } `}>
              <View>
                <View
                  className={` ${
                    dimensions.width > dimensions.height
                      ? 'flex flex-col items-center'
                      : 'flex flex-col items-center'
                  }`}>
                  <View className="  ">
                    <View className="self-center border w-48 h-48 rounded-full border-white">
                      <ImageBackground
                        source={require('../public/icons/4dots.gif')}>
                        <Image
                          className="h-full w-full rounded-full"
                          source={{uri: artistimg}}
                        />
                      </ImageBackground>
                    </View>
                  </View>
                </View>
                <View>
                  <View className="mt-10 mb-10">
                    <View className="ml-3 mb-4">
                      <Text className="text-white text-2xl">
                        Popular Releases
                      </Text>
                    </View>
                    <ScrollView
                      showsHorizontalScrollIndicator={false}
                      horizontal={true}>
                      {artistrecc
                        ? artistrecc.map((item, index) => {
                            return (
                              <RecommendationCard
                                key={index}
                                title={item.title}
                                id={item.id}
                                artist={
                                  item.artists[0]
                                    ? item.artists[0].name
                                    : 'null'
                                }
                                duration={0}
                                albumid={'noalbum'}
                                plays={'playing'}
                                url={item.thumbnail.contents[0].url}
                                hdurl={item.thumbnail.contents[0].url}
                              />
                            );
                          })
                        : null}
                    </ScrollView>
                  </View>
                </View>
                <View>
                  <View className=" mb-10">
                    <View className="ml-3 mb-4">
                      <Text className="text-white text-2xl">
                        Popular Albums
                      </Text>
                    </View>
                    <ScrollView
                      showsHorizontalScrollIndicator={false}
                      horizontal={true}>
                      {artistalbum
                        ? artistalbum.map((item, index) => {
                            return (
                              <Pressable
                                onPress={() => {
                                  setartistalbumshow(true);
                                  getalbumsongs(item.id);
                                  setartistalbumthumbnail(
                                    item.thumbnail[0].url,
                                  );
                                  setartistalbumtitle(item.title.text);
                                  setartistalbumid(item.id);
                                }}
                                className="flex flex-col justify-between border mx-2 rounded-xl border-white w-52 p-3"
                                key={index}>
                                <View className=" mb-2 align-middle">
                                  <Text
                                    className={`text-white text-center border my-auto ${
                                      item.title.text.length > 40
                                        ? 'text-xs'
                                        : 'text-base'
                                    }`}>
                                    {item.title.text}
                                  </Text>
                                </View>
                                <View className="w-36 h-36 self-center">
                                  <Image
                                    className="w-full h-full "
                                    source={{uri: item.thumbnail[0].url}}
                                  />
                                </View>
                              </Pressable>
                            );
                          })
                        : null}
                    </ScrollView>
                  </View>
                </View>
                <View className="mb-36">
                  <View className="ml-3 mb-1">
                    <Text className="text-white text-2xl">About:</Text>
                  </View>
                  <View className="p-2.5   self-end">
                    <Text className="text-white text-start">{artistdesc}</Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          </>
        )
      ) : complete ? (
        <ScrollView className="pt-10  " showsVerticalScrollIndicator={false}>
          <View>
            {mainarray1.length !== 0 ? (
              <>
                <View className="ml-5 mb-3">
                  <Text className="text-2xl text-white">You Might Like</Text>
                </View>
                <FlatList
                  showsHorizontalScrollIndicator={false}
                  data={mainarray1}
                  renderItem={renderItem}
                  initialNumToRender={2}
                  keyExtractor={(item, index) => index.toString()}
                  horizontal={true}
                />
              </>
            ) : null}
            {mainarray2.length !== 0 ? (
              <>
                <View className="ml-5 mt-5 mb-4">
                  <Text className="text-2xl text-white">Your Artists</Text>
                </View>
                <ScrollView
                  horizontal={true}
                  className=""
                  showsHorizontalScrollIndicator={false}>
                  {mainarray2.map((item, index) => {
                    if (
                      item[0].metadata.music_artist_name &&
                      item[0].metadata.music_artist_name.length !== 0
                    )
                      return (
                        <Pressable
                          onPress={() => {
                            handlepressartist(
                              item[1],
                              item[0].header.content.image.avatar.image[0].url,
                            );
                          }}
                          className="w-20 h-fit justify-start flex flex-col m-2 mr-6"
                          key={index}>
                          <Image
                            className="self-center h-20   w-20 rounded-full"
                            resizeMode="cover"
                            source={
                              item[0].length !== 0
                                ? {
                                    uri: item[0].header.content.image.avatar
                                      .image[0].url,
                                  }
                                : require('../public/icons/add.png')
                            }
                          />
                          <Text className="text-center self-center text-md text-white flex-wrap mt-1">
                            {item[0].metadata.music_artist_name}
                          </Text>
                        </Pressable>
                      );
                  })}
                </ScrollView>
              </>
            ) : null}
            {mainarray3.length !== 0 ? (
              <>
                <View className="ml-5 mt-5 mb-4">
                  <Text className="text-2xl text-white">Your Albums</Text>
                </View>
                <ScrollView
                  horizontal={true}
                  className="mb-56"
                  showsHorizontalScrollIndicator={false}>
                  {mainarray3.map((item, index) => {
                    return (
                      <Pressable
                        onPress={() => {
                          setalbumsongs(item.info.total_items);
                          handlepressalbum(
                            mainalbumarray[index],
                            item.info.thumbnails[1].url,
                            item.info.title,
                            albumidarray[index],
                          );
                        }}
                        className="w-32 h-fit justify-start flex flex-col m-2 mr-5"
                        key={index}>
                        <ImageBackground
                          source={require('../public/icons/4dots.gif')}>
                          <Image
                            className="self-center h-32   w-32 rounded-lg"
                            resizeMode="cover"
                            tintColor={
                              item.length !== 0 && item.info.thumbnails[2].url
                                ? ''
                                : 'white'
                            }
                            source={
                              item.length !== 0 && item.info.thumbnails[0].url
                                ? {uri: item.info.thumbnails[0].url}
                                : require('../public/icons/vinyl.png')
                            }
                          />
                        </ImageBackground>
                        <Text className="text-center self-center text-md text-white flex-wrap mt-1">
                          {truncateText(item.info.title)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </>
            ) : null}
          </View>
        </ScrollView>
      ) : (
        <View className="mx-auto mt-10 flex flex-col justify-center">
          <Image
            className="self-center h-44 w-44"
            source={require('../public/icons/pikachu2.gif')}
          />
          <Text className="text-white text-xl text-center self-center">
            {songsempty ? 'Listen to Songs First' : 'Loading'}
          </Text>
        </View>
      )}
    </>
  );
};

export default memo(PicksSubPage);
