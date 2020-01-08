import React, { Component, useState, useRef, useEffect } from 'react'
import { TextInput, ScrollView, View, Dimensions, ToastAndroid, AsyncStorage, Text, StatusBar, Keyboard, Linking, Modal, TouchableOpacity } from 'react-native';
import TranslatedCard from '../component/TranslatedCard';
import OldTranslatedCard from '../component/OldTranslatedCard'
import Icon from 'react-native-vector-icons/MaterialIcons';
import FAB from 'react-native-fab'
import DrawerLayout from 'react-native-gesture-handler/DrawerLayout';
import { BorderlessButton, TouchableWithoutFeedback, BaseButton, RectButton } from 'react-native-gesture-handler';
import Menu, { MenuItem } from 'react-native-material-menu';
import { BannerAd, BannerAdSize, TestIds, AdsConsent } from '@react-native-firebase/admob';
import { initial2korean, kakaoLang2Naver, kakaoLang2Google } from '../component/functions';
import SplashScreen from 'react-native-splash-screen'
import Secret from '../../secret';

const WIDTH = Dimensions.get('window').width;
const FAILMESSAGE = "실패";
const MIN_FETCH_DELAY = 2000;
const RED = '#E44034';
const LANGUAGELIST = ['kr', 'en', 'jp', 'cn', 'vi', 'de', 'es', 'fr', 'it']
const ANDROIDSTORE = 'https://play.google.com/store/apps/details?id=com.koreanthinker.translators';
const RATEUNIT = 70;
const TRANSLATORCOLOR = { 'NAVER': '#34A855', 'KAKAO': '#FABC05', 'GOOGLE': '#1A73E8' };
const DEFAULTSEQUENCE = ['GOOGLE', 'NAVER', 'KAKAO'];

let lastSrc = ''
let isNoMore = false;


export default homeScreen = (props) => {

    const { navigation } = props;

    //state
    const [src, setSrc] = useState('');
    const [google, setGoogle] = useState('');
    const [naver, setNaver] = useState('');
    const [kakao, setKakao] = useState('');
    const translatorDictionary = { 'GOOGLE': google, 'NAVER': naver, 'KAKAO': kakao }
    const [fetching, setFetching] = useState(true);
    const [srcLang, setSrcLang] = useState('en');
    const [targetLang, setTargetLang] = useState('kr');
    const [oldData, setOldData] = useState([]);
    const [rateVisible, setRateVisible] = useState(false);
    const [sequenceData, setSequenceData] = useState([]);

    //ref
    const drawerRef = useRef(null);
    const scrollViewRef = useRef(null);
    const srcLangRef = useRef(null);
    const targetLangRef = useRef(null);

    //초기화
    useEffect(() => {
        initialFunc();
    }, []);

    const initialFunc = async () => {
        //검색기록
        initializeOldData();
        //리뷰
        const rate = await AsyncStorage.getItem('RATE');
        if (rate === 'noMore') isNoMore === true
        //카드순서
        const seq = await AsyncStorage.getItem('SEQUENCE');
        let _seq;
        if (seq === null) {
            _seq = DEFAULTSEQUENCE;
            AsyncStorage.setItem('SEQUENCE', JSON.stringify(_seq));
        } else _seq = JSON.parse(seq);
        setSequenceData(_seq);

        setTimeout(() => {
            SplashScreen.hide();
            setTimeout(() => { setFetching(false); }, 500);
        }, 300);
    }


    //카드순서
    const setSequence = (data) => {
        setSequenceData(data);
        AsyncStorage.setItem('SEQUENCE', JSON.stringify(data));
    }

    //앱평가
    const onRate = () => {
        isNoMore = true;
        Linking.openURL(ANDROIDSTORE);
        setRateVisible(false);
        AsyncStorage.setItem('RATE', 'noMore');
    }

    const noRate = () => {
        isNoMore = true;
        setRateVisible(false);
        AsyncStorage.setItem('RATE', 'noMore');
    }

    const afterwards = () => {
        setRateVisible(false);
    }


    //검색기록
    const regesterOldData = async (text, src, target) => {
        //10개유지
        const d = oldData.filter((info, index) => index < 9);
        d.unshift({ text, src, target });
        setOldData(d);
        await AsyncStorage.setItem('OLD', JSON.stringify(d));
    }

    const removeOldData = async (_index) => {
        const d = oldData.filter((info, index) => index !== _index);
        setOldData(d);
        await AsyncStorage.setItem('OLD', JSON.stringify(d));
    }

    const initializeOldData = async () => {
        AsyncStorage.getItem('OLD').then(res => { //검색기록 가져오기
            const d = JSON.parse(res);
            if (d !== null) setOldData(d);
        })
    }

    //번역
    const translate = async () => {
        //clickEvent
        drawerRef.current.closeDrawer();
        Keyboard.dismiss();
        //check condition
        if (fetching) return;
        if (src === '') {
            ToastAndroid.show('내용을 입력해주세요', ToastAndroid.SHORT);
            return;
        }
        if (lastSrc === src) {
            ToastAndroid.show('내용이 같습니다', ToastAndroid.SHORT);
            return;
        }
        if (src.length > 1000) {
            ToastAndroid.show('글자 수 초과', ToastAndroid.SHORT);
            return;
        }


        setFetching(true);
        //easter egg 최적화좀
        if (src === '남궁현') {
            nameTranslate('')
            return
        } else if (src === '전은수') {
            nameTranslate('난은물');
            return
        }
        else if (src === '난은물') {
            nameTranslate('전은수')
            return
        } else if (src === '김종현') {
            nameTranslate('감자');
            return
        }
        else if (src === '윤재홍') {
            nameTranslate('이준석');
            return
        } else if (src === '이준석') {
            nameTranslate('윤재홍');
            return
        }
        else if (src === '손민영') {
            nameTranslate('만두');
            return
        } else if (src === '김환희' || src === '신하선' || src === '김진원') {
            nameTranslate('자기이름 쳐보는 찐따 있냐');
            return
        }
        //fetch


        lastSrc = src;
        let translated_kakao = FAILMESSAGE;
        let translated_naver = FAILMESSAGE;
        let translated_google = FAILMESSAGE;

        //kakao
        const kakao = await fetch(`https://kapi.kakao.com/v1/translation/translate?query=${src}`, {
            body: `src_lang=${srcLang}&target_lang=${targetLang}`,
            headers: {
                Authorization: Secret.kakao.auth,
                "Content-Type": "application/x-www-form-urlencoded"
            },
            method: "POST"
        })
        const kakaoJson = await kakao.json();
        try {
            translated_kakao = array2string(kakaoJson.translated_text);
        } catch (error) {
            if (kakaoJson.msg !== undefined) {

            }
        }


        //naver
        const naver = await fetch("https://naveropenapi.apigw.ntruss.com/nmt/v1/translation", {
            body: `source=${kakaoLang2Naver(srcLang)}&target=${kakaoLang2Naver(targetLang)}&text=${src}`,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "X-Ncp-Apigw-Api-Key": Secret.naver.apikey,
                "X-Ncp-Apigw-Api-Key-Id": Secret.naver.keyid
            },
            method: "POST"
        })
        const naverJson = await naver.json();
        try {
            if (naverJson.message) translated_naver = naverJson.message.result.translatedText;
            else translated_naver = naverJson.errorMessage;
        } catch (error) {

        }



        //google
        const google = await fetch(`https://www.googleapis.com/language/translate/v2?key=${Secret.google.key}&source=${kakaoLang2Google(srcLang)}&target=${kakaoLang2Google(targetLang)}&q=${src}`);
        const googleJson = await google.json();
        try {
            translated_google = googleJson.data.translations[0].translatedText
        } catch (error) {

        }


        // translated_google = '다음 업데이트를 기다려주세요'


        //rate
        if (!isNoMore) {
            let rateState = await AsyncStorage.getItem('RATE');
            if (rateState === null) rateState = 1
            else if (parseInt(rateState) % RATEUNIT === 0) setRateVisible(true);
            rateState++
            AsyncStorage.setItem('RATE', rateState.toString())
        }

        regesterOldData(src, srcLang, targetLang);
        setGoogle(translated_google);
        setNaver(translated_naver);
        setKakao(translated_kakao);
        setFetching(false)

    }

    const nameTranslate = (text) => {
        setGoogle(text);
        setNaver(text);
        setKakao(text);
        setFetching(false)
    }

    //src 변경
    const languageReverse = () => {
        const c = srcLang;
        setSrcLang(targetLang);
        setTargetLang(c);
        lastSrc = null
    }

    const reverseTranslate = (text) => {
        languageReverse();
        setSrc(text);
        initializeSrc()
    }

    const setData = (text, src, target) => {
        setSrcLang(src);
        setTargetLang(target);
        setSrc(text);
        initializeSrc();
    }

    const initializeSrc = () => {
        setGoogle('');
        setNaver('');
        setKakao('');
        scrollViewRef.current.scrollTo({ x: 0, y: 0, animated: true });
        lastSrc = null;
    }

    //drawer
    const drawerInside = () => {
        return <View style={{ flex: 1 }}>
            <View style={{ width: '100%', backgroundColor: RED, marginBottom: 10 }}>
                <View style={{ backgroundColor: 'white', width: 80, height: 80, borderRadius: 40, margin: 20, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="translate" size={40} color={RED} />
                </View>
            </View>
            <BaseButton onPress={() => navigation.navigate('Sequence', { sequenceData, setSequenceData: setSequence })} rippleColor='#bbb' style={{ width: '100%', height: 50, flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 50, alignItems: 'center' }}>
                    <Icon name="create" size={20} color={RED} />
                </View>
                <Text style={{ fontSize: 16 }}>카드 순서변경</Text>
            </BaseButton>
            <BaseButton onPress={() => {
                navigation.navigate('Record', { initializeOldData, setData, oldData })
                setTimeout(() => {
                    drawerRef.current.closeDrawer();
                }, 500);
            }} rippleColor='#bbb' style={{ width: '100%', height: 50, flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 50, alignItems: 'center' }}>
                    <Icon name="library-books" size={20} color={RED} />
                </View>
                <Text style={{ fontSize: 16 }}>번역 기록</Text>
            </BaseButton>

            <BaseButton onPress={() => navigation.navigate('Credit')} rippleColor='#bbb' style={{ width: '100%', height: 50, flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 50, alignItems: 'center' }}>
                    <Icon name="subtitles" size={20} color={RED} />
                </View>
                <Text style={{ fontSize: 16 }}>크레딧</Text>
            </BaseButton>
        </View>
    }

    return (
        <View style={{ flex: 1 }}>
            <StatusBar backgroundColor={RED} barStyle="light-content" animated={true} />
            <DrawerLayout
                ref={drawerRef}
                drawerWidth={WIDTH - 100}
                drawerPosition={DrawerLayout.positions.Left}
                drawerType='front'
                drawerBackgroundColor='white'
                renderNavigationView={drawerInside}
                statusBarAnimation='slide'
            >

                <ScrollView showsVerticalScrollIndicator={false} overScrollMode='never' ref={scrollViewRef}>
                    <View style={{ backgroundColor: RED, width: '100%', height: 52, flexDirection: 'row' }}>
                        <View style={{ width: 52, height: 52, alignItems: 'center', justifyContent: 'center' }}>
                            <TouchableWithoutFeedback onPress={() => drawerRef.current.openDrawer()}>
                                <Icon name="menu" size={24} color='white' style={{ margin: 5 }} />
                            </TouchableWithoutFeedback>
                        </View>
                        <View style={{ height: 52, justifyContent: 'center', marginLeft: 14 }}>
                            <Text style={{ color: 'white', fontSize: 20 }}>3가지 번역 비교하다</Text>
                        </View>
                    </View>
                    <View style={{ width: '100%', height: 52, backgroundColor: 'white', ...shadow, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                        <View style={{ flex: 1, alignItems: 'flex-start' }}>
                            <Menu
                                ref={srcLangRef}
                                button={<TouchableWithoutFeedback onPress={() => srcLangRef.current.show()}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', height: 52, paddingHorizontal: 20 }}>
                                        <Text style={{ fontSize: 16 }}>{initial2korean(srcLang)}</Text>
                                        <Icon name="arrow-drop-down" size={28} color={RED} />
                                    </View>
                                </TouchableWithoutFeedback>}>
                                {LANGUAGELIST.map((info, index) => <MenuItem onPress={() => {
                                    srcLangRef.current.hide()
                                    if (targetLang === info) setTargetLang(srcLang);
                                    setSrcLang(info);
                                    lastSrc = null
                                }} key={index}>{initial2korean(info)}</MenuItem>
                                )}

                            </Menu>
                        </View>

                        <BorderlessButton onPress={languageReverse} style={{ marginHorizontal: 30 }}>
                            <Icon name="compare-arrows" size={24} color={RED} style={{ margin: 5 }} />
                        </BorderlessButton>

                        <View style={{ flex: 1, alignItems: 'flex-end' }}>
                            <Menu
                                ref={targetLangRef}
                                button={<TouchableWithoutFeedback onPress={() => targetLangRef.current.show()}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', height: 52, paddingHorizontal: 20 }}>
                                        <Text style={{ fontSize: 16 }}>{initial2korean(targetLang)}</Text>
                                        <Icon name="arrow-drop-down" size={28} color={RED} />
                                    </View>
                                </TouchableWithoutFeedback>}>
                                {LANGUAGELIST.map((info, index) => <MenuItem onPress={() => {
                                    targetLangRef.current.hide()
                                    if (srcLang === info) setSrcLang(targetLang);
                                    setTargetLang(info);
                                    lastSrc = null
                                }} key={index}>{initial2korean(info)}</MenuItem>
                                )}
                            </Menu>
                        </View>
                    </View>


                    <TextInput
                        style={{ width: WIDTH - 20, marginTop: 50, marginBottom: 40, marginHorizontal: 10, fontSize: 16 }}
                        value={src}
                        onChangeText={t => setSrc(t)}
                        placeholder={'최대 1000글자까지 번역 가능'}
                        maxLength={1000}
                        multiline={true}
                    />


                    {sequenceData.map((data, index) =>
                        <TranslatedCard key={index} color={TRANSLATORCOLOR[data]} text={translatorDictionary[data]} apiName={data} reverse={reverseTranslate} navigation={navigation} />
                    )}


                    <View style={{ width: WIDTH - 20, margin: 10, backgroundColor: RED, borderRadius: 4, alignItems: 'center', justifyContent: 'center', padding: 10, ...shadow }}>
                        <BannerAd
                            unitId={Secret.Admob.bannerId}
                            // unitId={TestIds.BANNER}
                            size={BannerAdSize.BANNER}
                            requestOptions={{
                                requestNonPersonalizedAdsOnly: false,
                                testDevices: [
                                    'EMULATOR',
                                    'C2E2AD831DFDF0C51499307BCE07DA95'
                                ]
                            }}
                            onAdLoaded={() => {
                                // console.log('Advert loaded');
                            }}
                            onAdFailedToLoad={(error) => {
                                // console.error('Advert failed to load: ', error);
                            }}
                        />
                    </View>

                    {oldData.map((info, index) => {
                        if (index < 1) return <OldTranslatedCard removeOff key={index} text={info.text} title='최근검색' color={RED}
                            remove={() => removeOldData(index)}
                            register={() => setData(info.text, info.src, info.target)}
                        />
                    }
                    )}

                    <View style={{ height: 90 }} />
                </ScrollView>

            </DrawerLayout>

            <FAB buttonColor={RED} iconTextColor="#FFFFFF" onClickAction={translate} visible={!fetching} iconTextComponent={<Icon name="translate" />} />

            <Modal
                visible={rateVisible}
                transparent={true}
                animationType='fade'
            >
                <View style={{ backgroundColor: '#00000070', flex: 1 }} />
            </Modal>

            <Modal
                visible={rateVisible}
                transparent={true}
                animationType='slide'
                onRequestClose={() => setRateVisible(false)}
            >
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <View style={{ width: 240, height: 360, borderRadius: 4, ...shadow, overflow: 'hidden', alignItems: 'center' }}>
                        <TouchableOpacity activeOpacity={1} onPress={() => ToastAndroid.show('구글', ToastAndroid.SHORT)} style={{ flex: 1, backgroundColor: '#1A73E8', justifyContent: 'center', paddingHorizontal: 20 }}>
                            <Text style={{ color: 'white', fontSize: 16, textAlign: 'center' }}>Playstore에서 우리를 평가 해 주시겠습니까</Text>
                        </TouchableOpacity>
                        <TouchableOpacity activeOpacity={1} onPress={() => ToastAndroid.show('네이버', ToastAndroid.SHORT)} style={{ flex: 1, backgroundColor: '#34A855', justifyContent: 'center', paddingHorizontal: 20 }}>
                            <Text style={{ color: 'white', fontSize: 16, textAlign: 'center' }}>저희를 놀이 가게의 점수로 평가해 주시겠습니까?</Text>
                        </TouchableOpacity>
                        <TouchableOpacity activeOpacity={1} onPress={() => ToastAndroid.show('카카오', ToastAndroid.SHORT)} style={{ flex: 1, backgroundColor: '#FABC05', justifyContent: 'center', paddingHorizontal: 20 }}>
                            <Text style={{ color: 'white', fontSize: 16, textAlign: 'center' }}>놀이방에서 우리를 평가해 주시겠어요?</Text>
                        </TouchableOpacity>
                        <View style={{ width: '100%', backgroundColor: RED, alignItems: 'center' }}>
                            <TouchableOpacity activeOpacity={1} onPress={onRate} style={{ width: '100%' }} >
                                <BaseButton rippleColor='#bbb' style={{ width: '100%', height: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                                    <Text style={{ fontSize: 14, color: 'white' }}>평론을 쓰다</Text>
                                </BaseButton>
                            </TouchableOpacity>

                            <View style={{ width: '80%', height: 1, backgroundColor: '#ffffff80' }} />
                            <TouchableOpacity activeOpacity={1} onPress={noRate} style={{ width: '100%' }} >
                                <BaseButton onPress={() => {
                                }} rippleColor='#bbb' style={{ width: '100%', height: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                                    <Text style={{ fontSize: 14, color: 'white' }}>고맙지 만 사양 할게</Text>
                                </BaseButton>
                            </TouchableOpacity>

                            <View style={{ width: '80%', height: 1, backgroundColor: '#ffffff80' }} />
                            <TouchableOpacity activeOpacity={1} onPress={afterwards} style={{ width: '100%' }} >
                                <BaseButton onPress={() => {

                                }} rippleColor='#bbb' style={{ width: '100%', height: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                                    <Text style={{ fontSize: 14, color: 'white' }}>나중에</Text>
                                </BaseButton>
                            </TouchableOpacity>

                        </View>
                    </View>
                </View>
            </Modal>


        </View>
    )
}


function array2string(array) {
    let text = '';
    for (let i = 0; i < array.length; i++) {
        for (let j = 0; j < array[i].length; j++) {
            text += array[i][j];
        }
    }
    return text;
}



const shadow = {
    shadowColor: "#000",
    shadowOffset: {
        width: 0,
        height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,

    elevation: 4,
}