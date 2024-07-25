import {View, Text, Image, Pressable, ScrollView} from 'react-native';
import React, {useEffect, useState, memo} from 'react';
import {MMKV} from 'react-native-mmkv';

const PlayListModal = ({
  handlecreate,
  id,
  artist,
  title,
  thumbnail,
  duration,
  handleplaylist,
  handleoptions,
  handlesuccess,
  handlesuccessmsg,
}: {
  handlecreate: (data: boolean) => void;
  id: string;
  artist: string | undefined;
  title: string | undefined;
  thumbnail: string | undefined;
  duration: number | undefined;
  handleplaylist: (data: boolean) => void;
  handleoptions: (data: boolean) => void;
  handlesuccess: (data: boolean) => void;
  handlesuccessmsg: (data: string) => void;
}) => {
  const storage = new MMKV();
  const [mainarray, setmainarray] = useState([]);
  useEffect(() => {
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
  }, []);

  const getsongs = (id: string) => {
    const jsonString = storage.getString(id);
    let myArray = [];
    if (jsonString) {
      try {
        // Convert JSON string back to array
        myArray = JSON.parse(jsonString);
      } catch (e) {
        console.error('Error parsing JSON string from MMKV', e);
      }
    }
    return myArray.length;
  };

  const handlesubmit = (fid: string) => {
    const jsonString = storage.getString(fid);
    let myArray = [];
    if (jsonString) {
      try {
        // Convert JSON string back to array
        myArray = JSON.parse(jsonString);
      } catch (e) {
        console.error('Error parsing JSON string from MMKV', e);
      }
    }
    const obj = {
      artist: artist,
      title: title,
      id: id,
      thumbnail: thumbnail,
      duration: duration,
    };

    let dd = 0;
    myArray.forEach((element: {id: string}) => {
      if (element.id === id) {
        dd = 1;
      }
    });

    if (!dd) {
      myArray.unshift(obj);
      handlesuccessmsg('Song added Successfully');
    } else {
      handlesuccessmsg('Song Already Present');
    }

    const updatedJsonString = JSON.stringify(myArray);

    storage.set(fid, updatedJsonString);
    handleplaylist(false);
    handleoptions(false);
    handlesuccess(true);
  };

  return (
    <View
      className="flex flex-col p-4 "
      style={{
        position: 'absolute',
        bottom: 0,
        width: '100%',
        backgroundColor: 'black',
        zIndex: 20,
        height: 300,
      }}>
      <View className="flex flex-row justify-end mt-4 ">
        <Pressable
          className="p-2 border border-white rounded-xl bg-slate-900"
          onPress={() => {
            handlecreate(true);
          }}>
          <Text className="text-white ">Add new Playlist</Text>
        </Pressable>
      </View>
      <ScrollView className="w-full pt-4">
        {mainarray.length !== 0 ? (
          mainarray.map((item: any, index: any) => {
            return (
              <Pressable
                className="p-2 my-1 border border-white w-full rounded-lg flex flex-row justify-between"
                key={index}
                onPress={() => handlesubmit(item.id)}>
                <View className="flex flex-row">
                  <View className="h-4 w-4 self-center">
                    <Image
                      tintColor={'white'}
                      className="w-full h-full "
                      source={require('../public/icons/openplaylist.png')}
                    />
                  </View>
                  <Text className="text-white text-xl mb-1 ml-5">
                    {item.name}
                  </Text>
                </View>
                <View>
                  <Text>{getsongs(item.id)} Songs</Text>
                </View>
              </Pressable>
            );
          })
        ) : (
          <Text className="text-white mt-10 text-xl ml-5">
            No playlists created
          </Text>
        )}
      </ScrollView>
    </View>
  );
};

export default memo(PlayListModal);
