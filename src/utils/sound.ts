/**
 * 효과음 - 퀘스트 완료, 업적, 레벨업, 상점 구매 시 재생
 * 로컬 에셋 사용 (네트워크 불필요)
 */
import { Audio } from 'expo-av';

let audioModeSet = false;

async function ensureAudioMode() {
  if (audioModeSet) return;
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
    audioModeSet = true;
  } catch {}
}

const LOCAL_SOUND = require('../../assets/sounds/success.mp3');
const PLAY_DURATION_MS = 350; // 짧게만 재생 후 끊기

async function playLocal() {
  try {
    await ensureAudioMode();
    const { sound } = await Audio.Sound.createAsync(LOCAL_SOUND);
    await sound.playAsync();
    const timer = setTimeout(async () => {
      try {
        await sound.stopAsync();
        await sound.unloadAsync();
      } catch {}
    }, PLAY_DURATION_MS);
    sound.setOnPlaybackStatusUpdate((s) => {
      if (s.isLoaded && s.didJustFinishAndNotReset) {
        clearTimeout(timer);
        sound.unloadAsync();
      }
    });
  } catch {}
}

export async function playQuestComplete() {
  playLocal();
}

export async function playAchievement() {
  playLocal();
}

export async function playLevelUp() {
  playLocal();
}

export async function playPurchase() {
  playLocal();
}

export async function playComboBonus() {
  playLocal();
}
