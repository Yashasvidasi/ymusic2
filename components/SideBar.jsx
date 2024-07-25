import React, {useEffect, useRef, useState, memo} from 'react';
import {Image, ScrollView, Animated, View, Dimensions} from 'react-native';

import SideCard from './SideCard';

const SideBar = ({type, array, initial, handleIndex}) => {
  const [current, setcurrent] = useState(initial);
  const posvalue = useRef(new Animated.Value(0)).current;
  const opavalue = useRef(new Animated.Value(1)).current;

  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  useEffect(() => {
    const handleChange = ({window}) => {
      setDimensions(window);
    };

    const subscription = Dimensions.addEventListener('change', handleChange);

    return () => {
      subscription?.remove();
    };
  }, []);

  const visibleIn = () => {
    opavalue.setValue(0);
    Animated.timing(opavalue, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const fadeIn = () => {
    posvalue.setValue(-100);
    Animated.timing(posvalue, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  return (
    <>
      <View
        className={`w-14 h-14 p-1.5 absolute ${
          dimensions.width > dimensions.height ? 'left-7' : 'left-1.5'
        } top-4`}>
        <Image
          tintColor={'#C1C1C1'}
          className="w-full h-full "
          source={require('../public/icons/logomusic.png')}
        />
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        className="absolute h-full left-0 z-50 bg-black flex flex-col top-20 "
        style={
          dimensions.width > dimensions.height
            ? {
                width: '14%',
              }
            : {width: '20%'}
        }>
        {array.map((item, index) => {
          return (
            <SideCard
              position={index}
              handlerindex={handleIndex}
              dimension={dimensions}
              key={index}
              index={item.index}
              title={item.title}
              current={current}
              setcurrent={setcurrent}
              fadeIn={fadeIn}
              visibleIn={visibleIn}
              opavalue={opavalue}
              posvalue={posvalue}
              icon={item.icon}
            />
          );
        })}
      </ScrollView>
    </>
  );
};

export default memo(SideBar);
