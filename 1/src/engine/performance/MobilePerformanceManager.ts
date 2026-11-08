import * as THREE from 'three';
import { PerformanceStats, PerformanceTier } from '../types';

export class MobilePerformanceManager {
  private renderer: THREE.WebGLRenderer | null = null;
  private tier: PerformanceTier = 'high';
  private resolutionScale: number = 1.0;
  private frameCount: number = 0;
  private lastTime: number = performance.now();
  private fps: number = 60;
  private isMobileDevice: boolean = false;
  private adaptiveResolutionEnabled: boolean = true;

  constructor() {
    this.detectDevice();
  }

  private detectDevice() {
    if (typeof window === 'undefined') return;
    const ua = navigator.userAgent.toLowerCase();
    this.isMobileDevice = /android|iphone|ipad|ipod|mobile/.test(ua) || (window.innerWidth < 800);
    
    // Default tier based on device detection
    if (this.isMobileDevice) {
      // Conservative default for mobile to ensure smooth 60fps out of the box
      this.tier = 'medium';
      this.resolutionScale = 0.85;
    } else {
      this.tier = 'high';
      this.resolutionScale = 1.0;
    }
  }

  public attachRenderer(renderer: THREE.WebGLRenderer) {
    this.renderer = renderer;
    this.applySettings();
  }

  public setTier(tier: PerformanceTier) {
    this.tier = tier;
    switch (tier) {
      case 'low':
        this.resolutionScale = 0.7;
        break;
      case 'medium':
        this.resolutionScale = 0.85;
        break;
      case 'high':
        this.resolutionScale = 1.0;
        break;
      case 'ultra':
        this.resolutionScale = 1.0;
        break;
    }
    this.applySettings();
  }

  public getTier(): PerformanceTier {
    return this.tier;
  }

  public getResolutionScale(): number {
    return this.resolutionScale;
  }

  public isMobile(): boolean {
    return this.isMobileDevice;
  }

  public getFurShellsCount(): number {
    switch (this.tier) {
      case 'ultra':
        return 12;
      case 'high':
        return 6;
      case 'medium':
        return 2;
      case 'low':
      default:
        return 0; // Stylized gradient tufts only
    }
  }

  public getGrassDensity(): number {
    switch (this.tier) {
      case 'ultra':
        return 3500;
      case 'high':
        return 2200;
      case 'medium':
        return 1200;
      case 'low':
      default:
        return 500;
    }
  }

  public getShadowQuality(): { enabled: boolean; mapSize: number } {
    switch (this.tier) {
      case 'ultra':
        return { enabled: true, mapSize: 2048 };
      case 'high':
        return { enabled: true, mapSize: 1024 };
      case 'medium':
        return { enabled: true, mapSize: 512 };
      case 'low':
      default:
        return { enabled: false, mapSize: 256 };
    }
  }

  public applySettings() {
    if (!this.renderer) return;

    const shadowSettings = this.getShadowQuality();
    this.renderer.shadowMap.enabled = shadowSettings.enabled;
    if (shadowSettings.enabled) {
      this.renderer.shadowMap.type =
        this.tier === 'ultra' ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
    }

    // Set pixel ratio capped to 1.5 on mobile to avoid 3x retina overdraw
    const baseDpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const maxDpr = this.tier === 'ultra' ? 2 : this.isMobileDevice ? 1.25 : 1.5;
    const finalDpr = Math.min(baseDpr * this.resolutionScale, maxDpr);
    this.renderer.setPixelRatio(finalDpr);
  }

  public updateFrame(currentTime: number): PerformanceStats {
    this.frameCount++;
    const delta = currentTime - this.lastTime;

    if (delta >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / delta);
      this.frameCount = 0;
      this.lastTime = currentTime;

      // Adaptive resolution scaling
      if (this.adaptiveResolutionEnabled && this.renderer) {
        if (this.fps < 28 && this.resolutionScale > 0.6) {
          this.resolutionScale = Math.max(0.6, this.resolutionScale - 0.05);
          this.applySettings();
        } else if (this.fps > 55 && this.resolutionScale < 1.0) {
          this.resolutionScale = Math.min(1.0, this.resolutionScale + 0.02);
          this.applySettings();
        }
      }
    }

    const info = this.renderer?.info;

    return {
      fps: this.fps,
      drawCalls: info?.render.calls || 0,
      triangles: info?.render.triangles || 0,
      resolutionScale: Math.round(this.resolutionScale * 100) / 100,
      tier: this.tier,
      furShellsCount: this.getFurShellsCount(),
      grassInstances: this.getGrassDensity(),
    };
  }

  public toggleAdaptive(enable: boolean) {
    this.adaptiveResolutionEnabled = enable;
  }
}
