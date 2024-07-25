import {View, Text, Pressable, Animated} from 'react-native';
import React, {memo} from 'react';

const SideCard = ({
  handlerindex,
  dimension,
  title,
  current,
  setcurrent,
  fadeIn,
  visibleIn,
  opavalue,
  posvalue,
  icon,
  position,
  index,
}) => {
  return (
    <Pressable
      underlayColor={'white'}
      onPress={() => {
        setcurrent(title);
        handlerindex(index);
        if (current !== title) {
          fadeIn();
          visibleIn();
        }
      }}>
      <Animated.View
        className={`flex flex-col items-center py-1  px-2 ${
          current === title ? 'left-3 border-white' : 'border-zinc-400 '
        }  ${
          dimension.width > dimension.height
            ? ' border-r border-y rounded-r-xl pl-10 -ml-8 my-2 py-2 w-32'
            : 'rounded-b-xl w-24 -rotate-90 my-1 pt-10 border-b border-x -ml-9'
        } ${position === 0 ? 'mt-5' : ''} ${position === 3 ? 'mb-44' : ''}`}>
        <View className=" flex items-center">
          <Animated.Image
            tintColor={current === title ? 'white' : 'black'}
            className={'h-5 w-5 my-1'}
            style={{
              opacity: opavalue,
              transform: [
                dimension.width > dimension.height
                  ? {translateX: posvalue}
                  : {translateY: posvalue},
              ],
            }}
            source={icon}
          />
          <Text
            className={`text-base md:text-lg lg:text-xl ${
              current === title ? 'text-white' : 'text-slate-400'
            }`}>
            {title}
          </Text>
        </View>
      </Animated.View>
    </Pressable>
  );
};

export default memo(SideCard);
