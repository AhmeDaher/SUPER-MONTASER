import { AudioManager } from '../audio/AudioManager';
import { LearningEngine } from '../learning/LearningEngine';
import { AnimalType, Mission } from '../types';

export class MissionSystem {
  private missions: Mission[] = [
    {
      id: 'mission_elephant',
      title: 'Find the Elephant',
      instruction: 'Find the Elephant! Listen for its trumpet in the jungle.',
      targetAnimal: 'elephant',
      targetType: 'animal',
      targetCount: 1,
      currentCount: 0,
      completed: false,
      rewardCoins: 10,
      rewardStars: 1,
      badgeName: 'Elephant Explorer',
      educationalPrompt: 'Elephants are the largest land animals on Earth! Can you spell ELEPHANT?',
    },
    {
      id: 'mission_giraffe',
      title: 'Find the Tall Giraffe',
      instruction: 'Look up high for the tall Giraffe with brown spots!',
      targetAnimal: 'giraffe',
      targetType: 'animal',
      targetCount: 1,
      currentCount: 0,
      completed: false,
      rewardCoins: 10,
      rewardStars: 1,
      badgeName: 'Giraffe Observer',
      educationalPrompt: 'Giraffes have very long necks to reach sweet leaves on high trees.',
    },
    {
      id: 'mission_lion',
      title: 'Find the Roaring Lion',
      instruction: 'Can you find the mighty Lion with the big fluffy mane?',
      targetAnimal: 'lion',
      targetType: 'animal',
      targetCount: 1,
      currentCount: 0,
      completed: false,
      rewardCoins: 10,
      rewardStars: 1,
      badgeName: 'Brave Explorer',
      educationalPrompt: 'Lions are known as the King of the Jungle!',
    },
    {
      id: 'mission_monkey',
      title: 'Find the Playful Monkey',
      instruction: 'Search near the trees for the cheeky, playful Monkey!',
      targetAnimal: 'monkey',
      targetType: 'animal',
      targetCount: 1,
      currentCount: 0,
      completed: false,
      rewardCoins: 10,
      rewardStars: 1,
      badgeName: 'Monkey Friend',
      educationalPrompt: 'Monkeys love climbing trees and swinging by their tails.',
    },
    {
      id: 'mission_stars',
      title: 'Collect 5 Jungle Stars',
      instruction: 'Explore the secret paths and collect 5 glowing jungle stars!',
      targetAnimal: null,
      targetType: 'collect_stars',
      targetCount: 5,
      currentCount: 0,
      completed: false,
      rewardCoins: 20,
      rewardStars: 2,
      badgeName: 'Star Tracker',
      educationalPrompt: 'Golden stars help unlock special explorer badges in your journal!',
    },
  ];

  private currentMissionIndex: number = 0;
  private learningEngine: LearningEngine;
  private audioManager: AudioManager;

  constructor(learningEngine: LearningEngine, audioManager: AudioManager) {
    this.learningEngine = learningEngine;
    this.audioManager = audioManager;
  }

  public getCurrentMission(): Mission {
    return this.missions[this.currentMissionIndex];
  }

  public getAllMissions(): Mission[] {
    return this.missions;
  }

  public speakMissionInstruction() {
    const mission = this.getCurrentMission();
    this.learningEngine.speak(mission.instruction);
  }

  public setMission(missionIndex: number) {
    if (missionIndex >= 0 && missionIndex < this.missions.length) {
      this.currentMissionIndex = missionIndex;
      this.speakMissionInstruction();
    }
  }

  public nextMission(): Mission | null {
    if (this.currentMissionIndex < this.missions.length - 1) {
      this.currentMissionIndex++;
      this.speakMissionInstruction();
      return this.getCurrentMission();
    }
    return null;
  }

  public onAnimalDiscovered(
    type: AnimalType
  ): {
    isTarget: boolean;
    missionCompleted: boolean;
    speechText: string;
    mission: Mission;
  } {
    const mission = this.getCurrentMission();
    const content = this.learningEngine.getAnimalContent(type);

    if (mission.targetType === 'animal' && mission.targetAnimal === type) {
      // Completed target!
      mission.currentCount = 1;
      mission.completed = true;

      this.audioManager.playCelebrationFanfare();

      return {
        isTarget: true,
        missionCompleted: true,
        speechText: content.successFeedback,
        mission,
      };
    } else {
      // Incorrect discovery -> Friendly learning feedback
      return {
        isTarget: false,
        missionCompleted: false,
        speechText: content.wrongPromptFeedback,
        mission,
      };
    }
  }

  public onStarCollected(
    totalStars: number
  ): { missionCompleted: boolean; mission: Mission | null } {
    const mission = this.getCurrentMission();
    if (mission.targetType === 'collect_stars') {
      mission.currentCount = totalStars;
      if (mission.currentCount >= mission.targetCount && !mission.completed) {
        mission.completed = true;
        this.audioManager.playCelebrationFanfare();
        return { missionCompleted: true, mission };
      }
    }
    return { missionCompleted: false, mission: null };
  }
}
