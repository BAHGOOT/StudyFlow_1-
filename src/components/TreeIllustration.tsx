import { TreeSpecies } from '../types';

interface TreeIllustrationProps {
  progressPercent: number; // 0 to 100
  species?: TreeSpecies;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isWithered?: boolean;
  className?: string;
}

export function TreeIllustration({
  progressPercent,
  species = 'Oak',
  size = 'md',
  isWithered = false,
  className = '',
}: TreeIllustrationProps) {
  const percent = Math.min(100, Math.max(0, progressPercent));

  // Determine growth stage
  const stage =
    percent < 25 ? 'sprout' : percent < 55 ? 'sapling' : percent < 85 ? 'growing' : 'bloomed';

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-28 h-28',
    lg: 'w-44 h-44',
    xl: 'w-60 h-60',
  }[size];

  // Species color mappings
  const getFoliageColors = () => {
    if (isWithered) {
      return { main: '#78716c', accent: '#a8a29e', shadow: '#57534e' };
    }
    switch (species) {
      case 'Cherry Blossom':
        return { main: '#f472b6', accent: '#fbcfe8', shadow: '#db2777' };
      case 'Pine':
        return { main: '#059669', accent: '#34d399', shadow: '#047857' };
      case 'Birch':
        return { main: '#84cc16', accent: '#d9f99d', shadow: '#65a30d' };
      case 'Bonsai':
        return { main: '#10b981', accent: '#6ee7b7', shadow: '#047857' };
      case 'Maple':
        return { main: '#ea580c', accent: '#fb923c', shadow: '#c2410c' };
      case 'Golden Ginkgo':
        return { main: '#eab308', accent: '#fef08a', shadow: '#ca8a04' };
      case 'Willow':
        return { main: '#15803d', accent: '#86efac', shadow: '#14532d' };
      case 'Redwood':
        return { main: '#047857', accent: '#10b981', shadow: '#064e3b' };
      case 'Oak':
      default:
        return { main: '#16a34a', accent: '#4ade80', shadow: '#15803d' };
    }
  };

  const foliage = getFoliageColors();

  return (
    <div className={`relative flex items-center justify-center select-none ${sizeClasses} ${className}`}>
      <svg
        viewBox="0 0 120 120"
        className="w-full h-full drop-shadow-sm transition-all duration-700 ease-out"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id={`glow-${species}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={foliage.accent} stopOpacity="0.3" />
            <stop offset="100%" stopColor={foliage.accent} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient aura when bloomed */}
        {stage === 'bloomed' && !isWithered && (
          <circle cx="60" cy="55" r="46" fill={`url(#glow-${species})`} className="animate-pulse" />
        )}

        {/* Fertile Ground / Soil Mound */}
        <ellipse cx="60" cy="106" rx="34" ry="7" fill="#e2e8f0" />
        <ellipse cx="60" cy="105" rx="28" ry="5.5" fill="#cbd5e1" />
        <ellipse cx="60" cy="104" rx="22" ry="4" fill="#64748b" opacity="0.25" />

        {/* STAGE 1: SPROUT (0-24%) */}
        {stage === 'sprout' && (
          <g className="transition-all duration-500">
            {/* Small soil clods */}
            <circle cx="56" cy="103" r="2" fill="#475569" />
            <circle cx="64" cy="103" r="1.5" fill="#475569" />

            {/* Sprout stem */}
            <path
              d="M 60 104 Q 59 96 60 90"
              stroke="#16a34a"
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
            />
            {/* Left baby leaf */}
            <path
              d="M 60 90 Q 52 87 53 94 C 54 98 59 94 60 90 Z"
              fill={foliage.main}
              className="origin-bottom-right animate-[wiggle_3s_ease-in-out_infinite]"
            />
            {/* Right baby leaf */}
            <path
              d="M 60 90 Q 68 87 67 94 C 66 98 61 94 60 90 Z"
              fill={foliage.accent}
            />
          </g>
        )}

        {/* STAGE 2: SAPLING (25-54%) */}
        {stage === 'sapling' && (
          <g className="transition-all duration-500">
            {/* Roots */}
            <path d="M 58 104 Q 55 106 52 105" stroke="#78350f" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M 62 104 Q 65 106 68 105" stroke="#78350f" strokeWidth="2" strokeLinecap="round" fill="none" />

            {/* Slender trunk */}
            <path
              d="M 60 104 Q 59 85 60 72"
              stroke={isWithered ? '#78716c' : '#854d0e'}
              strokeWidth="4.5"
              strokeLinecap="round"
              fill="none"
            />
            {/* Small branches */}
            <path d="M 60 84 Q 52 79 50 82" stroke="#854d0e" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M 60 78 Q 68 73 70 76" stroke="#854d0e" strokeWidth="2.5" strokeLinecap="round" fill="none" />

            {/* Leaf clumps */}
            <circle cx="50" cy="81" r="7" fill={foliage.main} />
            <circle cx="70" cy="75" r="8" fill={foliage.accent} />
            <circle cx="60" cy="67" r="11" fill={foliage.main} />
            <circle cx="60" cy="64" r="7" fill={foliage.accent} />
          </g>
        )}

        {/* STAGE 3: GROWING TREE (55-84%) */}
        {stage === 'growing' && (
          <g className="transition-all duration-500">
            {/* Trunk */}
            <path
              d="M 57 104 Q 58 80 56 64 L 64 64 Q 62 80 63 104 Z"
              fill={isWithered ? '#57534e' : '#78350f'}
            />
            {/* Branches */}
            <path d="M 58 74 Q 44 65 42 68" stroke="#78350f" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            <path d="M 62 70 Q 76 62 78 66" stroke="#78350f" strokeWidth="3.5" strokeLinecap="round" fill="none" />

            {/* Foliage Clouds */}
            <ellipse cx="42" cy="62" rx="14" ry="12" fill={foliage.shadow} />
            <ellipse cx="42" cy="60" rx="13" ry="11" fill={foliage.main} />

            <ellipse cx="78" cy="60" rx="14" ry="12" fill={foliage.shadow} />
            <ellipse cx="78" cy="58" rx="13" ry="11" fill={foliage.accent} />

            <circle cx="60" cy="52" r="19" fill={foliage.shadow} />
            <circle cx="60" cy="50" r="18" fill={foliage.main} />
            <circle cx="60" cy="46" r="12" fill={foliage.accent} />
          </g>
        )}

        {/* STAGE 4 & 5: MATURE / BLOOMED TREE (85-100%) */}
        {stage === 'bloomed' && (
          <g className="transition-all duration-500">
            {/* Sturdy Roots */}
            <path d="M 56 104 Q 50 106 44 105" stroke="#78350f" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M 64 104 Q 70 106 76 105" stroke="#78350f" strokeWidth="3" strokeLinecap="round" fill="none" />

            {/* Thick Trunk with Bark Texturing */}
            <path
              d={
                species === 'Redwood'
                  ? 'M 50 104 Q 54 60 52 40 L 68 40 Q 66 60 70 104 Z'
                  : 'M 55 104 Q 57 76 54 56 L 66 56 Q 63 76 65 104 Z'
              }
              fill={
                isWithered
                  ? '#44403c'
                  : species === 'Redwood'
                  ? '#991b1b'
                  : species === 'Birch'
                  ? '#f8fafc'
                  : '#78350f'
              }
            />
            {/* Trunk bark texture */}
            {species === 'Birch' ? (
              <>
                <line x1="56" y1="95" x2="62" y2="95" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="58" y1="82" x2="65" y2="82" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="55" y1="68" x2="61" y2="68" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" />
              </>
            ) : (
              <>
                <path d="M 58 78 Q 59 90 58 98" stroke={species === 'Redwood' ? '#7f1d1d' : '#5d2907'} strokeWidth="1.5" strokeLinecap="round" />
                <path d="M 62 70 Q 61 82 62 92" stroke={species === 'Redwood' ? '#7f1d1d' : '#5d2907'} strokeWidth="1.5" strokeLinecap="round" />
              </>
            )}

            {species === 'Pine' ? (
              // Pine tiered conical foliage
              <g>
                <polygon points="60,20 30,55 90,55" fill={foliage.shadow} />
                <polygon points="60,18 32,53 88,53" fill={foliage.main} />
                <polygon points="60,35 24,70 96,70" fill={foliage.shadow} />
                <polygon points="60,33 26,68 94,68" fill={foliage.main} />
                <polygon points="60,50 18,85 102,85" fill={foliage.shadow} />
                <polygon points="60,48 20,83 100,83" fill={foliage.accent} />
              </g>
            ) : species === 'Redwood' ? (
              // Redwood towering layered crown
              <g>
                <polygon points="60,12 36,44 84,44" fill={foliage.shadow} />
                <polygon points="60,10 38,42 82,42" fill={foliage.main} />
                <polygon points="60,26 28,60 92,60" fill={foliage.shadow} />
                <polygon points="60,24 30,58 90,58" fill={foliage.main} />
                <polygon points="60,42 22,76 98,76" fill={foliage.shadow} />
                <polygon points="60,40 24,74 96,74" fill={foliage.accent} />
              </g>
            ) : species === 'Willow' ? (
              // Willow weeping canopy with cascading tendrils
              <g>
                <circle cx="60" cy="40" r="26" fill={foliage.shadow} />
                <circle cx="60" cy="38" r="24" fill={foliage.main} />
                <circle cx="60" cy="34" r="18" fill={foliage.accent} />
                {/* Weeping fronds */}
                <path d="M 40 45 Q 32 65 30 86" stroke={foliage.main} strokeWidth="3" strokeLinecap="round" fill="none" />
                <path d="M 48 48 Q 42 70 41 90" stroke={foliage.accent} strokeWidth="2.5" strokeLinecap="round" fill="none" />
                <path d="M 72 48 Q 78 70 79 90" stroke={foliage.accent} strokeWidth="2.5" strokeLinecap="round" fill="none" />
                <path d="M 80 45 Q 88 65 90 86" stroke={foliage.main} strokeWidth="3" strokeLinecap="round" fill="none" />
                <path d="M 60 50 Q 58 72 57 88" stroke={foliage.accent} strokeWidth="2" strokeLinecap="round" fill="none" />
              </g>
            ) : species === 'Bonsai' ? (
              // Bonsai artistic pads
              <g>
                <ellipse cx="38" cy="62" rx="16" ry="9" fill={foliage.shadow} />
                <ellipse cx="38" cy="60" rx="15" ry="8" fill={foliage.main} />
                <ellipse cx="82" cy="56" rx="18" ry="10" fill={foliage.shadow} />
                <ellipse cx="82" cy="54" rx="17" ry="9" fill={foliage.main} />
                <ellipse cx="58" cy="40" rx="22" ry="12" fill={foliage.shadow} />
                <ellipse cx="58" cy="38" rx="20" ry="11" fill={foliage.accent} />
              </g>
            ) : (
              // Lush Round Deciduous Canopy (Oak, Cherry Blossom, Maple, Birch, Golden Ginkgo)
              <g>
                {/* Back shadow blobs */}
                <circle cx="40" cy="56" r="18" fill={foliage.shadow} />
                <circle cx="80" cy="56" r="18" fill={foliage.shadow} />
                <circle cx="60" cy="42" r="24" fill={foliage.shadow} />

                {/* Main foliage clouds */}
                <circle cx="40" cy="53" r="17" fill={foliage.main} />
                <circle cx="80" cy="53" r="17" fill={foliage.main} />
                <circle cx="60" cy="39" r="23" fill={foliage.main} />

                {/* Front highlight clouds */}
                <circle cx="48" cy="46" r="15" fill={foliage.accent} />
                <circle cx="72" cy="46" r="15" fill={foliage.accent} />
                <circle cx="60" cy="34" r="14" fill={foliage.accent} />

                {/* Blossoms / Sparkles / Golden leaves */}
                {!isWithered && percent === 100 && (
                  <g className="animate-pulse">
                    {species === 'Cherry Blossom' ? (
                      <>
                        <circle cx="44" cy="42" r="2.5" fill="#fdf2f8" />
                        <circle cx="74" cy="40" r="2.5" fill="#fdf2f8" />
                        <circle cx="58" cy="28" r="2.5" fill="#fdf2f8" />
                        <circle cx="66" cy="48" r="2.5" fill="#fdf2f8" />
                        <circle cx="36" cy="56" r="2.5" fill="#fdf2f8" />
                      </>
                    ) : species === 'Maple' ? (
                      <>
                        <circle cx="45" cy="40" r="2.5" fill="#fef08a" />
                        <circle cx="75" cy="42" r="2.5" fill="#fef08a" />
                        <circle cx="60" cy="30" r="2.5" fill="#fef08a" />
                      </>
                    ) : species === 'Golden Ginkgo' ? (
                      <>
                        <circle cx="42" cy="38" r="2.5" fill="#ffffff" />
                        <circle cx="78" cy="36" r="2.5" fill="#ffffff" />
                        <circle cx="60" cy="26" r="3" fill="#ffffff" />
                        <circle cx="50" cy="50" r="2" fill="#fef08a" />
                        <circle cx="70" cy="50" r="2" fill="#fef08a" />
                      </>
                    ) : (
                      <>
                        <circle cx="42" cy="45" r="2" fill="#fde047" />
                        <circle cx="76" cy="43" r="2" fill="#fde047" />
                        <circle cx="56" cy="30" r="2" fill="#fde047" />
                        <circle cx="64" cy="46" r="2" fill="#fde047" />
                      </>
                    )}
                  </g>
                )}
              </g>
            )}
          </g>
        )}
      </svg>
    </div>
  );
}
