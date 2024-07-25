import React, {useEffect, useRef, useState} from 'react';
import {Animated, View} from 'react-native';
import SearchSubPage from '../subpages/SearchSubPage';
import PlaylistsSubPage from '../subpages/PlaylistsSubPage';
import SongsSubPage from '../subpages/SongsSubPage';
import PicksSubPage from '../subpages/PicksSubPage';

const SubPage = ({data, direction}: {data: number; direction: string}) => {
  const [currentPage, setCurrentPage] = useState(data);
  const fadeAnim = useRef(
    new Animated.Value(direction === 'up' ? -400 : 400),
  ).current;
  const opaValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Trigger fade out and then change the page
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: direction === 'up' ? 400 : -400,
        duration: 200, // Duration of the fade out animation
        useNativeDriver: true,
      }),
      Animated.timing(opaValue, {
        toValue: 0,
        duration: 150, // Duration of the fade out animation
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentPage(data);
      fadeAnim.setValue(direction === 'up' ? -400 : 400);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200, // Duration of the fade in animation
          useNativeDriver: true,
        }),
        Animated.timing(opaValue, {
          toValue: 1,
          duration: 150, // Duration of the fade in animation
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [data]);

  const renderPage = () => {
    switch (currentPage) {
      case 0:
        return <PicksSubPage />;
      case 1:
        return <SongsSubPage />;
      case 2:
        return <PlaylistsSubPage />;
      case 5:
        return <SearchSubPage />;
      default:
        return null;
    }
  };

  return (
    <Animated.View
      style={{opacity: opaValue, transform: [{translateY: fadeAnim}]}}>
      {renderPage()}
    </Animated.View>
  );
};

export default SubPage;
