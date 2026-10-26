import React from 'react';
import { sound } from '../game/audio.ts';
import { UI_ASSETS } from '../game/assets.ts';
import { SciFiFrame, SciFiButton, UI3DIcon } from './SciFiFrame.tsx';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onQuitToTitle: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onQuitToTitle,
}) => {
  const [soundEnabled, setSoundEnabled] = React.useState(sound.enabled);

  const handleToggleSound = () => {
    const next = sound.toggleSound();
    setSoundEnabled(next);
    if (next) sound.playUiClick();
  };

  return (
    <div className="absolute inset-0 z-40 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-5 select-none">
      <SciFiFrame
        variant="cyan"
        glowIntensity="high"
        className="w-full max-w-sm p-6 text-center"
      >
        <div className="w-16 h-16 mx-auto mb-3 ai-thumb-active-cyan flex items-center justify-center">
          <UI3DIcon src={UI_ASSETS.icons.pause} size={34} />
        </div>

        <h2 className="text-xl font-black tracking-wider text-white mb-1 uppercase">
          SYSTEM PAUSIERT
        </h2>
        <p className="text-xs text-slate-300 font-mono mb-5">
          Taktische Gefechts-Unterbrechung aktiv
        </p>

        <div className="space-y-2.5">
          <SciFiButton
            variant="cyan"
            size="lg"
            active
            onClick={onResume}
            className="w-full py-3"
          >
            <UI3DIcon src={UI_ASSETS.icons.hangar} size={18} />
            <span>WEITERSPIELEN</span>
          </SciFiButton>

          <SciFiButton
            variant="slate"
            size="md"
            onClick={handleToggleSound}
            className="w-full py-2.5"
          >
            <UI3DIcon
              src={soundEnabled ? UI_ASSETS.icons.audioOn : UI_ASSETS.icons.audioOff}
              size={18}
            />
            <span>Audio: {soundEnabled ? 'AKTIV' : 'STUMM'}</span>
          </SciFiButton>

          <SciFiButton
            variant="amber"
            size="md"
            onClick={onRestart}
            className="w-full py-2.5"
          >
            <UI3DIcon src={UI_ASSETS.icons.rifts} size={18} />
            <span>Sektor Neu Starten</span>
          </SciFiButton>

          <SciFiButton
            variant="rose"
            size="md"
            onClick={onQuitToTitle}
            className="w-full py-2.5"
          >
            <UI3DIcon src={UI_ASSETS.icons.hq} size={18} />
            <span>Zurück zur Sternenbasis</span>
          </SciFiButton>
        </div>
      </SciFiFrame>
    </div>
  );
};
