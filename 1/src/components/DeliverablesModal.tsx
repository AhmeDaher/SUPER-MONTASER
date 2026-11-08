import React, { useState } from 'react';
import { X, FileCode, CheckCircle, Smartphone, Terminal, BookOpen, Layers } from 'lucide-react';

interface DeliverablesModalProps {
  onClose: () => void;
}

export const DeliverablesModal: React.FC<DeliverablesModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'reused' | 'new' | 'mobile' | 'build'>('overview');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm pointer-events-auto">
      <div className="relative w-full max-w-3xl bg-gradient-to-b from-slate-900 to-emerald-950 border-2 border-amber-400/80 rounded-3xl p-6 shadow-2xl text-white max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-bold text-xl">
              📜
            </div>
            <div>
              <h2 className="text-xl font-bold font-cartoon text-amber-300">
                Engine Architecture & Deliverables Report
              </h2>
              <p className="text-xs text-white/70">
                Super Montaser 3D Game Engine Proof of Concept (Phases 1–10)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center transition-all text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 pt-3 pb-2 border-b border-white/10 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'overview' ? 'bg-amber-400 text-amber-950 shadow' : 'bg-white/5 text-white/80 hover:bg-white/10'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> 1. Project Overview
          </button>
          <button
            onClick={() => setActiveTab('reused')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'reused' ? 'bg-amber-400 text-amber-950 shadow' : 'bg-white/5 text-white/80 hover:bg-white/10'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" /> 2. Reused Systems
          </button>
          <button
            onClick={() => setActiveTab('new')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'new' ? 'bg-amber-400 text-amber-950 shadow' : 'bg-white/5 text-white/80 hover:bg-white/10'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" /> 3. Newly Built Systems
          </button>
          <button
            onClick={() => setActiveTab('mobile')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'mobile' ? 'bg-amber-400 text-amber-950 shadow' : 'bg-white/5 text-white/80 hover:bg-white/10'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" /> 4. Mobile & Android
          </button>
          <button
            onClick={() => setActiveTab('build')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'build' ? 'bg-amber-400 text-amber-950 shadow' : 'bg-white/5 text-white/80 hover:bg-white/10'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" /> 5. Build & VS Code
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto py-4 text-xs space-y-3 leading-relaxed text-white/90">
          {activeTab === 'overview' && (
            <div className="space-y-3">
              <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10">
                <h3 className="font-bold text-amber-300 text-sm mb-1 font-cartoon">
                  🎯 Purpose & Core Objective
                </h3>
                <p>
                  This proof of concept transforms technical rendering techniques from the foundational repository (
                  <span className="text-amber-200 font-mono">AhmeDaher/3D-GPU-Fur-Simulation</span>) into a genuine, fully
                  interactive 3D educational adventure game engine running on WebGL2, Three.js, TypeScript, and Vite.
                </p>
                <p className="mt-1.5 text-emerald-200">
                  ✓ The existing repository was a creature/fur simulation; this project builds a complete, modular runtime game architecture decoupled from React rendering.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
                  <h4 className="font-bold text-white mb-1">🎮 Real 3D Playable Prototype</h4>
                  <ul className="list-disc list-inside space-y-0.5 text-white/80">
                    <li>Controllable 3D character: Mr. Montaser</li>
                    <li>Full state machine (walk, run, jump, land, celebrate, interact)</li>
                    <li>Smooth follow camera with terrain collision avoidance</li>
                    <li>Zero external 3D model files (100% procedural geometry)</li>
                  </ul>
                </div>
                <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
                  <h4 className="font-bold text-white mb-1">🦁 Procedural Jungle Wildlife</h4>
                  <ul className="list-disc list-inside space-y-0.5 text-white/80">
                    <li>4 distinct animals: Elephant, Lion, Giraffe, Monkey</li>
                    <li>Dynamic head tracking towards player</li>
                    <li>Volumetric fur mane simulation on Lion</li>
                    <li>Articulated trunk & flapping ears on Elephant</li>
                  </ul>
                </div>
              </div>

              <div className="bg-amber-400/10 p-3 rounded-2xl border border-amber-400/30">
                <h4 className="font-bold text-amber-300 mb-0.5">🌟 Pedagogy & Educational Flow</h4>
                <p>
                  Implements <strong>"MISSION: FIND THE ELEPHANT"</strong> with spoken Web Speech audio instruction, friendly English learning feedback on exploring incorrect creatures (Lion, Giraffe, Monkey), phonetic spelling, and reward celebrations opening ancient jungle chests!
                </p>
              </div>
            </div>
          )}

          {activeTab === 'reused' && (
            <div className="space-y-3">
              <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10">
                <h3 className="font-bold text-amber-300 text-sm mb-1 font-cartoon">
                  🔄 Components Reused / Adapted from 3D-GPU-Fur-Simulation
                </h3>
                <p className="mb-2">
                  The following key principles and techniques from the fur simulation repository were identified, adapted, and safeguarded:
                </p>
                <div className="space-y-2">
                  <div className="bg-black/30 p-2.5 rounded-xl">
                    <p className="font-bold text-emerald-300">1. Volumetric Fur Shell Technique (Adapted for Mobile)</p>
                    <p className="text-white/80 text-[11px]">
                      Reused the multi-layer concentric extruded shell geometry concept on Simba the Lion's mane. Adapted to scale down to 0–4 shells on mobile devices to prevent GPU overdraw and fill-rate collapse.
                    </p>
                  </div>
                  <div className="bg-black/30 p-2.5 rounded-xl">
                    <p className="font-bold text-emerald-300">2. Instanced Wind-Blown Grass Shader</p>
                    <p className="text-white/80 text-[11px]">
                      Reused the GPU vertex-displacement wave formula from the grass painter (sin/cos wind sway proportional to blade UV height) implemented in a lightweight custom Three.js ShaderMaterial.
                    </p>
                  </div>
                  <div className="bg-black/30 p-2.5 rounded-xl">
                    <p className="font-bold text-emerald-300">3. Procedural Noise & Organic Vertex Deformation</p>
                    <p className="text-white/80 text-[11px]">
                      Reused pseudo-random Hermite and fractal noise fields for organic terrain elevation, riverbed carving, and rock deformation.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'new' && (
            <div className="space-y-3">
              <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10">
                <h3 className="font-bold text-amber-300 text-sm mb-1 font-cartoon">
                  ✨ Newly Implemented Architecture Systems
                </h3>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="bg-black/30 p-2 rounded-xl">
                    <p className="font-bold text-amber-300">• GameRuntime</p>
                    <p className="text-[11px] text-white/70">Central game loop, WebGL2 lifecycle, zero-allocation RAF updates.</p>
                  </div>
                  <div className="bg-black/30 p-2 rounded-xl">
                    <p className="font-bold text-amber-300">• CharacterController</p>
                    <p className="text-[11px] text-white/70">8-state machine, procedural stride/arm swing, gravity, jumping.</p>
                  </div>
                  <div className="bg-black/30 p-2 rounded-xl">
                    <p className="font-bold text-amber-300">• CameraController</p>
                    <p className="text-[11px] text-white/70">Follow damping, orbit pitch/yaw, terrain collision raycast.</p>
                  </div>
                  <div className="bg-black/30 p-2 rounded-xl">
                    <p className="font-bold text-amber-300">• CollisionSystem</p>
                    <p className="text-[11px] text-white/70">Elevation sampling, cylinder push-back, bridge deck walk collider.</p>
                  </div>
                  <div className="bg-black/30 p-2 rounded-xl">
                    <p className="font-bold text-amber-300">• ProceduralCharacterFactory</p>
                    <p className="text-[11px] text-white/70">Full 3D Mr. Montaser rig: explorer hat, backpack, limbs, face.</p>
                  </div>
                  <div className="bg-black/30 p-2 rounded-xl">
                    <p className="font-bold text-amber-300">• ProceduralAnimalFactory</p>
                    <p className="text-[11px] text-white/70">Procedural Lion, Giraffe, Monkey, and Elephant with distinct rigs.</p>
                  </div>
                  <div className="bg-black/30 p-2 rounded-xl">
                    <p className="font-bold text-amber-300">• AnimalBehaviorSystem</p>
                    <p className="text-[11px] text-white/70">Head-tracking IK, proximity reactions, trumpet animations.</p>
                  </div>
                  <div className="bg-black/30 p-2 rounded-xl">
                    <p className="font-bold text-amber-300">• LearningEngine</p>
                    <p className="text-[11px] text-white/70">Web Speech synthesis, phonics, English spelling, animal facts.</p>
                  </div>
                  <div className="bg-black/30 p-2 rounded-xl">
                    <p className="font-bold text-amber-300">• AudioManager</p>
                    <p className="text-[11px] text-white/70">Synthesized Web Audio footsteps, jumps, roars, trumpets, chimes.</p>
                  </div>
                  <div className="bg-black/30 p-2 rounded-xl">
                    <p className="font-bold text-amber-300">• PerformanceManager</p>
                    <p className="text-[11px] text-white/70">Adaptive resolution scaler, 4 quality tiers, hardware safeguards.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'mobile' && (
            <div className="space-y-3">
              <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10">
                <h3 className="font-bold text-amber-300 text-sm mb-1 font-cartoon">
                  📱 Mobile & Android Target Safeguards
                </h3>
                <ul className="list-disc list-inside space-y-1.5 text-white/80">
                  <li>
                    <strong>Adaptive Resolution Scaling:</strong> Dynamically reduces render scale down to 0.6x if frame rate drops below 30 FPS, and restores when smooth.
                  </li>
                  <li>
                    <strong>Fur Shell Throttling:</strong> Unlike desktop simulations that render 64 shells, mobile defaults to 0–2 shells or procedural tufts, eliminating fill-rate bottlenecks.
                  </li>
                  <li>
                    <strong>Touch Ergonomics:</strong> Virtual on-screen touch joystick on the left, Jump and Action buttons on the right, and smooth camera swipe zone.
                  </li>
                  <li>
                    <strong>Zero Garbage Collection Stalls:</strong> Pre-allocated scratch Vector3, Matrix4, and Quaternion instances in the render loop to prevent frame stutter.
                  </li>
                  <li>
                    <strong>No External Asset Downloads:</strong> Runs completely standalone with procedural WebGL2 geometry, requiring zero network bandwidth after load.
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'build' && (
            <div className="space-y-3">
              <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10">
                <h3 className="font-bold text-amber-300 text-sm mb-1 font-cartoon">
                  💻 Development & Build Instructions
                </h3>
                <p className="mb-2">To run or build this project locally using VS Code and CLI:</p>
                <div className="bg-black/50 p-3 rounded-xl font-mono text-[11px] text-emerald-300 space-y-1">
                  <p># 1. Install dependencies</p>
                  <p className="text-white">npm install</p>
                  <p className="pt-1"># 2. Run local development server</p>
                  <p className="text-white">npm run dev</p>
                  <p className="pt-1"># 3. Create production Android / Web build</p>
                  <p className="text-white">npm run build</p>
                  <p className="pt-1"># 4. Preview production build</p>
                  <p className="text-white">npm run preview</p>
                </div>

                <div className="mt-3 p-2.5 bg-emerald-950/60 border border-emerald-500/30 rounded-xl text-[11px]">
                  <p className="font-bold text-emerald-300 flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" /> Commercial Safety & Integrity:
                  </p>
                  <p className="text-white/80 mt-0.5">
                    No advertisements • No in-app purchases • No external tracking • 100% child-safe educational design.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold text-xs font-cartoon transition-all"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
