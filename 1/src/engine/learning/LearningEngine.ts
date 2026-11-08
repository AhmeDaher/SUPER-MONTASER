import { AnimalType } from '../types';

export interface EducationalAnimalContent {
  type: AnimalType;
  word: string;
  spelling: string[];
  phonics: string;
  funFact: string;
  habitat: string;
  diet: string;
  voiceIntro: string;
  wrongPromptFeedback: string;
  successFeedback: string;
}

export class LearningEngine {
  private hasSpeechSynthesis: boolean = false;
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private isSpeaking: boolean = false;

  private animalData: Record<AnimalType, EducationalAnimalContent> = {
    elephant: {
      type: 'elephant',
      word: 'ELEPHANT',
      spelling: ['E', 'L', 'E', 'P', 'H', 'A', 'N', 'T'],
      phonics: '/ˈel.ə.fənt/',
      funFact: 'Elephants are the largest land animals! They use their long trunks to drink water, pick fruit, and say hello.',
      habitat: 'African Savannah & Deep Jungle',
      diet: 'Leaves, grass, and wild fruit',
      voiceIntro: 'Find the Elephant! Listen for its mighty trumpet in the jungle.',
      wrongPromptFeedback: 'You found the Elephant! Great job exploring!',
      successFeedback: 'Super job! You found the Elephant! Look at its long trunk and big flapping ears!',
    },
    lion: {
      type: 'lion',
      word: 'LION',
      spelling: ['L', 'I', 'O', 'N'],
      phonics: '/ˈlaɪ.ən/',
      funFact: 'Lions are known as the King of the Jungle! Male lions have a magnificent fluffy mane around their neck.',
      habitat: 'Grassy Plains & Jungle Borders',
      diet: 'Carnivore (loves big meals)',
      voiceIntro: 'Can you find the roaring Lion with the big fluffy mane?',
      wrongPromptFeedback: 'You found the Lion! The Lion is the King of the Jungle with a big fluffy mane. But can you find the Elephant?',
      successFeedback: 'Roar! You discovered the mighty Lion!',
    },
    giraffe: {
      type: 'giraffe',
      word: 'GIRAFFE',
      spelling: ['G', 'I', 'R', 'A', 'F', 'F', 'E'],
      phonics: '/dʒəˈræf/',
      funFact: 'Giraffes are the tallest animals in the world! Their long blue tongues can reach leaves on the highest acacia trees.',
      habitat: 'Acacia Woodlands & Jungle Clearings',
      diet: 'Acacia leaves and fresh shoots',
      voiceIntro: 'Look high above for the tall Giraffe with brown spots!',
      wrongPromptFeedback: 'Look at this tall Giraffe! Giraffes have very long necks to reach high leaves. Keep searching for the Elephant!',
      successFeedback: 'Amazing! You found the tall Giraffe reaching for the jungle canopy!',
    },
    monkey: {
      type: 'monkey',
      word: 'MONKEY',
      spelling: ['M', 'O', 'N', 'K', 'E', 'Y'],
      phonics: '/ˈmʌŋ.ki/',
      funFact: 'Monkeys use their strong hands and tails to balance and swing between high jungle branches.',
      habitat: 'High Jungle Canopy & Riverside Trees',
      diet: 'Bananas, nuts, seeds, and blossoms',
      voiceIntro: 'Search near the trees for the cheeky, playful Monkey!',
      wrongPromptFeedback: 'Hello little Monkey! Monkeys love to swing on branches and eat bananas. Where could the Elephant be hiding?',
      successFeedback: 'Ooh ooh aah aah! You found the playful Monkey!',
    },
  };

  constructor() {
    this.hasSpeechSynthesis = typeof window !== 'undefined' && 'speechSynthesis' in window;
    if (this.hasSpeechSynthesis) {
      this.initVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => this.initVoices();
      }
    }
  }

  private initVoices() {
    if (!this.hasSpeechSynthesis) return;
    const voices = window.speechSynthesis.getVoices();
    // Prefer friendly English voices (e.g. Google US English, Samantha, Daniel, etc.)
    const preferred = voices.find(
      (v) =>
        v.lang.startsWith('en') &&
        (v.name.includes('Natural') ||
          v.name.includes('Samantha') ||
          v.name.includes('Google') ||
          v.name.includes('Daniel') ||
          v.name.includes('Female'))
    );
    this.selectedVoice = preferred || voices.find((v) => v.lang.startsWith('en')) || null;
  }

  public speak(text: string, rate: number = 0.95, pitch: number = 1.1) {
    if (!this.hasSpeechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      if (this.selectedVoice) {
        utterance.voice = this.selectedVoice;
      }
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.lang = 'en-US';

      utterance.onstart = () => {
        this.isSpeaking = true;
      };
      utterance.onend = () => {
        this.isSpeaking = false;
      };
      utterance.onerror = () => {
        this.isSpeaking = false;
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  }

  public speakSpelling(letters: string[]) {
    const text = letters.join(' ... ') + ' ... ' + letters.join('');
    this.speak(text, 0.85, 1.15);
  }

  public isCurrentlySpeaking(): boolean {
    return this.isSpeaking;
  }

  public stopSpeaking() {
    if (this.hasSpeechSynthesis) {
      window.speechSynthesis.cancel();
      this.isSpeaking = false;
    }
  }

  public getAnimalContent(type: AnimalType): EducationalAnimalContent {
    return this.animalData[type];
  }

  public getAllAnimals(): EducationalAnimalContent[] {
    return Object.values(this.animalData);
  }
}
