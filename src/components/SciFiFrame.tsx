import React from 'react';
import { sound } from '../game/audio.ts';
import { UI_ASSETS } from '../game/assets.ts';

export type SciFiVariant = 'cyan' | 'amber' | 'purple' | 'rose' | 'emerald' | 'slate';

interface SciFiFrameProps {
  children: React.ReactNode;
  variant?: SciFiVariant;
  className?: string;
  title?: string;
  subtitle?: string;
  cornerSize?: 'sm' | 'md' | 'lg';
  glow?: boolean;
  glowIntensity?: 'low' | 'medium' | 'high';
  scanlines?: boolean;
  onClick?: () => void;
}

const VARIANT_META: Record<
  SciFiVariant,
  {
    panelClass: string;
    btnClass: string;
    btnActiveClass: string;
    barFillClass: string;
    text: string;
    cornerColor: string;
  }
> = {
  cyan: {
    panelClass: 'ai-panel-cyan',
    btnClass: 'ai-btn-cyan text-cyan-100 hover:border-cyan-400/60 hover:bg-cyan-950/70',
    btnActiveClass: 'ai-btn-active-cyan text-white',
    barFillClass: 'ai-bar-fill-cyan',
    text: 'text-cyan-300',
    cornerColor: 'border-cyan-400/50',
  },
  amber: {
    panelClass: 'ai-panel-amber',
    btnClass: 'ai-btn-amber text-amber-100 hover:border-amber-400/60 hover:bg-amber-950/70',
    btnActiveClass: 'ai-btn-active-amber text-white',
    barFillClass: 'ai-bar-fill-amber',
    text: 'text-amber-300',
    cornerColor: 'border-amber-400/50',
  },
  purple: {
    panelClass: 'ai-panel-purple',
    btnClass: 'ai-btn-purple text-purple-100 hover:border-purple-400/60 hover:bg-purple-950/70',
    btnActiveClass: 'ai-btn-active-purple text-white',
    barFillClass: 'ai-bar-fill-purple',
    text: 'text-purple-300',
    cornerColor: 'border-purple-400/50',
  },
  rose: {
    panelClass: 'ai-panel-rose',
    btnClass: 'ai-btn-rose text-rose-100 hover:border-rose-400/60 hover:bg-rose-950/70',
    btnActiveClass: 'ai-btn-active-rose text-white',
    barFillClass: 'ai-bar-fill-rose',
    text: 'text-rose-300',
    cornerColor: 'border-rose-400/50',
  },
  emerald: {
    panelClass: 'ai-panel-emerald',
    btnClass: 'ai-btn-emerald text-emerald-100 hover:border-emerald-400/60 hover:bg-emerald-950/70',
    btnActiveClass: 'ai-btn-active-emerald text-white',
    barFillClass: 'ai-bar-fill-emerald',
    text: 'text-emerald-300',
    cornerColor: 'border-emerald-400/50',
  },
  slate: {
    panelClass: 'ai-panel-slate',
    btnClass: 'ai-btn-slate text-slate-200 hover:border-slate-500/60 hover:bg-slate-800/70',
    btnActiveClass: 'ai-btn-slate text-white border-slate-400/70 bg-slate-800/90',
    barFillClass: 'ai-bar-fill-cyan',
    text: 'text-slate-300',
    cornerColor: 'border-slate-500/40',
  },
};

export const UI3DIcon: React.FC<{
  src: string;
  alt?: string;
  size?: number;
  className?: string;
}> = ({ src, alt = '', size = 20, className = '' }) => (
  <img
    src={src}
    alt={alt}
    referrerPolicy="no-referrer"
    style={{ width: size, height: size }}
    className={`object-contain select-none pointer-events-none shrink-0 drop-shadow-[0_2px_4px_rgba(0,0,0,0.65)] ${className}`}
  />
);

export const SciFiProgressBar: React.FC<{
  percent: number;
  variant?: SciFiVariant;
  heightClass?: string;
  className?: string;
}> = ({ percent, variant = 'cyan', heightClass = 'h-2', className = '' }) => {
  const meta = VARIANT_META[variant];
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div
      className={`relative w-full ${heightClass} ai-bar-track overflow-hidden select-none ${className}`}
    >
      <div
        className={`h-full transition-all duration-150 ${meta.barFillClass}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
};

export const SciFiFrame: React.FC<SciFiFrameProps> = ({
  children,
  variant = 'cyan',
  className = '',
  title,
  subtitle,
  onClick,
}) => {
  const meta = VARIANT_META[variant];

  return (
    <div
      onClick={onClick}
      className={`relative transition-all duration-150 ${meta.panelClass} ${
        onClick ? 'cursor-pointer hover:brightness-110' : ''
      } ${className}`}
    >
      {(title || subtitle) && (
        <div className="relative z-10 px-4 py-2.5 border-b border-slate-800/80 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <img
              src={UI_ASSETS.icons.quantumShard}
              alt=""
              className="w-4 h-4 object-contain shrink-0"
            />
            <span className={`text-xs font-mono font-bold uppercase tracking-wider truncate ${meta.text}`}>
              {title}
            </span>
          </div>
          {subtitle && (
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider shrink-0">
              {subtitle}
            </span>
          )}
        </div>
      )}

      <div className="relative z-10">{children}</div>
    </div>
  );
};

interface SciFiButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: SciFiVariant;
  size?: 'sm' | 'md' | 'lg';
  active?: boolean;
}

export const SciFiButton: React.FC<SciFiButtonProps> = ({
  children,
  variant = 'cyan',
  size = 'md',
  active = false,
  className = '',
  onClick,
  disabled,
  ...rest
}) => {
  const meta = VARIANT_META[disabled ? 'slate' : variant];
  const pad =
    size === 'sm'
      ? 'px-3 py-1.5 text-xs min-h-[34px]'
      : size === 'lg'
      ? 'px-5 py-3 text-sm min-h-[46px]'
      : 'px-4 py-2 text-xs min-h-[38px]';

  const surfaceClass = disabled
    ? 'ai-btn-slate text-slate-500 cursor-not-allowed opacity-55'
    : active
    ? `${meta.btnActiveClass} cursor-pointer active:scale-[0.98]`
    : `${meta.btnClass} cursor-pointer active:scale-[0.98]`;

  return (
    <button
      disabled={disabled}
      onMouseEnter={() => {
        if (!disabled) sound.playUiHover();
      }}
      onClick={(e) => {
        if (!disabled) {
          sound.playUiClick();
          onClick?.(e);
        }
      }}
      className={`group relative font-mono font-bold tracking-wide transition-all duration-150 select-none flex items-center justify-center gap-2 ${pad} ${surfaceClass} ${className}`}
      {...rest}
    >
      <span className="relative z-10 flex items-center justify-center gap-1.5 leading-snug text-center">
        {children}
      </span>
    </button>
  );
};

// Real 3D AI-Generated Singularity Reactor Core Graphic
export const SingularityCoreGraphic: React.FC<{
  size?: number;
  rank?: number;
  className?: string;
}> = ({ size = 112, rank = 0, className = '' }) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative flex items-center justify-center select-none flex-shrink-0 ${className}`}
    >
      <img
        src={UI_ASSETS.hud.singularityCore}
        alt="Singularity Core"
        referrerPolicy="no-referrer"
        className="w-full h-full object-contain animate-[spin_24s_linear_infinite] drop-shadow-[0_0_18px_rgba(245,158,11,0.45)]"
      />
      {rank > 0 && (
        <div className="absolute -bottom-1.5 px-2.5 py-0.5 ai-btn-active-amber text-amber-100 font-mono font-bold text-[10px] whitespace-nowrap">
          PRESTIGE {rank}
        </div>
      )}
    </div>
  );
};

// Real 3D AI-Generated Void Rift Anomaly Portal Graphic
export const VoidRiftPortalGraphic: React.FC<{
  size?: number;
  depth?: number;
  className?: string;
}> = ({ size = 112, depth = 1, className = '' }) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative flex items-center justify-center select-none flex-shrink-0 ${className}`}
    >
      <img
        src={UI_ASSETS.hud.voidRiftPortal}
        alt="Void Rift Portal"
        referrerPolicy="no-referrer"
        className="w-full h-full object-contain animate-[spin_20s_linear_infinite] drop-shadow-[0_0_18px_rgba(168,85,247,0.45)]"
      />
      <div className="absolute -bottom-1.5 px-2.5 py-0.5 ai-btn-active-purple text-purple-100 font-mono font-bold text-[10px] whitespace-nowrap">
        STUFE {depth}
      </div>
    </div>
  );
};
