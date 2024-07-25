import React, {useEffect, useRef} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {LogBox} from 'react-native';
import HomePage from './pages/HomePage';
import PlayerPage from './components/Player';
import TrackPlayer from 'react-native-track-player';
import PlaylistInPlayer from './components/PlaylistInPlayer';
import {MMKV} from 'react-native-mmkv';

LogBox.ignoreAllLogs();

const App = () => {
  const hasEffectRun = useRef(false);
  const storage = new MMKV();
  useEffect(() => {
    // Check if the effect has already run
    if (!hasEffectRun.current) {
      // Mark the effect as run
      hasEffectRun.current = true;

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

      myArray2 = [];
      const updatedJsonString2 = JSON.stringify(myArray2);

      storage.set('downloadbuffer', updatedJsonString2);
    }
  }, []);

  useEffect(() => {
    // Initialize the Track Player
    const initializePlayer = async () => {
      await TrackPlayer.setupPlayer();
    };

    initializePlayer();
  }, []);
  const Stack = createNativeStackNavigator();
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_bottom',
        }}>
        <Stack.Screen name="Home" component={HomePage} />
        <Stack.Screen
          name="Player"
          component={PlayerPage}
          detachInactiveScreens={false}
        />
        <Stack.Screen name="PlayerPlaylist" component={PlaylistInPlayer} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
