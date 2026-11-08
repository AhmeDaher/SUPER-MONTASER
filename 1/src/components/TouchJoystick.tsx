import React, { useRef, useState, useEffect } from 'react';

interface TouchJoystickProps {
  onMove: (x: number, z: number) => void;
}

export const TouchJoystick: React.FC<TouchJoystickProps> = ({ onMove }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [touchPos, setTouchPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [active, setActive] = useState(false);
  const touchIdRef = useRef<number | null>(null);

  const maxRadius = 45;

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (touchIdRef.current !== null) return;
    const touch = e.changedTouches[0];
    touchIdRef.current = touch.identifier;
    setActive(true);
    updatePosition(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchIdRef.current) {
        updatePosition(touch.clientX, touch.clientY);
        break;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchIdRef.current) {
        touchIdRef.current = null;
        setActive(false);
        setTouchPos({ x: 0, y: 0 });
        onMove(0, 0);
        break;
      }
    }
  };

  const updatePosition = (clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const dist = Math.hypot(dx, dy);

    let clampedX = dx;
    let clampedY = dy;
    if (dist > maxRadius) {
      clampedX = (dx / dist) * maxRadius;
      clampedY = (dy / dist) * maxRadius;
    }

    setTouchPos({ x: clampedX, y: clampedY });

    // Output normalized coordinates (-1 to 1)
    // dy > 0 is pulling joystick down -> move backward (z > 0)
    // dy < 0 is pushing joystick up -> move forward (z < 0)
    const normX = clampedX / maxRadius;
    const normZ = clampedY / maxRadius;
    onMove(normX, normZ);
  };

  useEffect(() => {
    return () => {
      onMove(0, 0);
    };
  }, [onMove]);

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      className={`relative w-28 h-28 rounded-full border-2 ${
        active ? 'border-amber-400 bg-black/40' : 'border-white/30 bg-black/25'
      } backdrop-blur-md flex items-center justify-center pointer-events-auto touch-none shadow-lg transition-colors select-none`}
    >
      {/* Center knob */}
      <div
        style={{
          transform: `translate(${touchPos.x}px, ${touchPos.y}px)`,
        }}
        className={`w-12 h-12 rounded-full ${
          active ? 'bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.8)]' : 'bg-white/60'
        } transition-transform duration-75 flex items-center justify-center`}
      >
        <div className="w-4 h-4 rounded-full bg-white/40" />
      </div>

      {/* Guide indicators */}
      <div className="absolute top-1 text-[10px] text-white/40 font-bold">▲</div>
      <div className="absolute bottom-1 text-[10px] text-white/40 font-bold">▼</div>
      <div className="absolute left-1 text-[10px] text-white/40 font-bold">◀</div>
      <div className="absolute right-1 text-[10px] text-white/40 font-bold">▶</div>
    </div>
  );
};
