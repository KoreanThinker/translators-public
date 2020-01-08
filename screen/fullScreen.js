import React, { Component, useState, useRef } from 'react'
import { View, Dimensions, Text, StatusBar } from 'react-native';
import { BorderlessButton } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/MaterialIcons';


const WIDTH = Dimensions.get('window').width;
const RED = '#E44034';

export default fullScreen = (props) => {
    const { navigation } = props;


    return (
        <View style={{ flex: 1, backgroundColor: navigation.getParam('color', RED), alignItems: 'center', justifyContent: 'center' }}>
            <StatusBar backgroundColor={navigation.getParam('color', RED)} barStyle="light-content" />
            <Text style={{ color: 'white', textAlign: 'center', width: WIDTH - 20, fontSize: 40 }}>{navigation.getParam('text', '오류')}</Text>
        </View>
    )
}
