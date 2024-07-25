import {View, Text, Pressable, TextInput} from 'react-native';
import React, {useState, memo} from 'react';
import {MMKV} from 'react-native-mmkv';

const CreatePlayListModal = ({
  handlecreate,
  handleplaylist,
  handleoptions,
  handlesuccess,
  handlesuccessmsg,
  id,
  artist,
  title,
  thumbnail,
  duration,
}: {
  handlecreate: (data: boolean) => void;
  handleplaylist: (data: boolean) => void;
  handleoptions: (data: boolean) => void;
  handlemodalvisible: (data: boolean) => void;
  handlesuccess: (data: boolean) => void;
  handlesuccessmsg: (data: string) => void;
  id: string | undefined;
  artist: string | undefined;
  title: string | undefined;
  thumbnail: string | undefined;
  duration: number | undefined;
}) => {
  const [text, settext] = useState('');
  const storage = new MMKV();

  const handlesongadd = (fid: string) => {
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
    }

    const updatedJsonString = JSON.stringify(myArray);

    storage.set(fid, updatedJsonString);
  };

  const handlesubmit = () => {
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

    for (let i = 0; i < myArray.length; i++) {
      if (myArray[i].name === text) {
        handlecreate(false);
        handleplaylist(false);
        handleoptions(false);

        return;
      }
    }
    const newid = `playlistid${myArray.length + 1}`;
    const obj = {
      name: text,
      id: newid,
    };
    myArray.unshift(obj);
    const updatedJsonString = JSON.stringify(myArray);

    storage.set('playlist4', updatedJsonString);
    handlesuccessmsg('Song added Successfully');
    handlesongadd(newid);
    handlecreate(false);
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
        zIndex: 30,
        height: 140,
      }}>
      <View className="flex flex-row justify-center">
        <Text className="text-white text-2xl">Create New Playlist</Text>
      </View>
      <View className="flex flex-row w-full mt-3">
        <TextInput
          className="rounded-lg px-3 bg-zinc-800 text-lg h-10 text-white"
          style={{
            width: '81%',
          }}
          onChangeText={newText => settext(newText)}></TextInput>
        <Pressable
          className="self-center"
          onPress={() => {
            handlesubmit();
          }}>
          <Text className="text-white text-center text-lg p-1 border border-white rounded-lg ml-2">
            Confirm
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

export default memo(CreatePlayListModal);
