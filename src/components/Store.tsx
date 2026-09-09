import { useState } from 'react';
import { TreeSpecies, Course } from '../types';
import { TREE_SPECIES_CATALOG } from '../data/treeSpecies';
import { TreeIllustration } from './TreeIllustration';
import {
  ShoppingBag,
  Coins,
  Sparkles,
  Check,
  Lock,
  Palette,
  Headphones,
  Trees,
  HelpCircle,
  Gift,
  Tag,
  ArrowRight,
} from 'lucide-react';

interface StoreProps {
  coins: number;
  unlockedSpecies: TreeSpecies[];
  onUnlockSpecies: (species: TreeSpecies, price: number) => boolean;
  onNavigateToForest: () => void;
  onNavigateToTasks: () => void;
}

type StoreCategory = 'all' | 'trees' | 'themes' | 'audio';

interface StoreItemPlaceholder {
  id: string;
  name: string;
  category: 'themes' | 'audio';
  price: number;
  description: string;
  badge: string;
  icon: typeof Palette;
}

const UPCOMING_STORE_ITEMS: StoreItemPlaceholder[] = [
  {
    id: 'theme-oled',
    name: 'Midnight OLED Theme',
    category: 'themes',
    price: 40,
    description: 'Deep black background with neon emerald & indigo contrast for late night study sprints.',
    badge: 'Coming in Next Update',
    icon: Palette,
  },
  {
    id: 'theme-parchment',
    name: 'Academic Parchment',
    category: 'themes',
    price: 30,
    description: 'Warm antique paper tones inspired by historic university libraries and old manuscripts.',
    badge: 'Coming in Next Update',
    icon: Palette,
  },
  {
    id: 'audio-rain',
    name: 'Rain on Library Glass',
    category: 'audio',
    price: 20,
    description: 'Gentle raindrops tapping on windowpanes to mask background dormitory distractions.',
    badge: 'Audio Ambience (Soon)',
    icon: Headphones,
  },
  {
    id: 'audio-cafe',
    name: 'Quiet Study Hall Whispers',
    category: 'audio',
    price: 20,
    description: 'Subtle atmospheric room acoustics that stimulate cognitive focus and deep work.',
    badge: 'Audio Ambience (Soon)',
    icon: Headphones,
  },
];

export function Store({
  coins,
  unlockedSpecies,
  onUnlockSpecies,
  onNavigateToForest,
  onNavigateToTasks,
}: StoreProps) {
  const [selectedCategory, setSelectedCategory] = useState<StoreCategory>('all');
  const [purchaseSuccessItem, setPurchaseSuccessItem] = useState<string | null>(null);

  const handleBuySpecies = (speciesId: TreeSpecies, price: number) => {
    const success = onUnlockSpecies(speciesId, price);
    if (success) {
      setPurchaseSuccessItem(speciesId);
      setTimeout(() => setPurchaseSuccessItem(null), 3000);
    }
  };

  const unlockedCount = unlockedSpecies.length;
  const totalSpeciesCount = TREE_SPECIES_CATALOG.length;

  return (
    <div id="store-screen" className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 tracking-tight">
            Store
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Unlock botanical tree species for your grove using earned study coins.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-bold shadow-2xs">
            <span className="text-base">🪙</span>
            <span>{coins} Coins</span>
          </div>
          <button
            type="button"
            onClick={onNavigateToForest}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl transition-colors"
          >
            <span>View Forest Grove</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Category Navigation Filter */}
      <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            id="store-tab-all"
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>All Store Items</span>
          </button>

          <button
            id="store-tab-trees"
            type="button"
            onClick={() => setSelectedCategory('trees')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              selectedCategory === 'trees'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Trees className="w-4 h-4 text-emerald-500" />
            <span>Botanical Trees ({totalSpeciesCount})</span>
          </button>

          <button
            id="store-tab-themes"
            type="button"
            onClick={() => setSelectedCategory('themes')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              selectedCategory === 'themes'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Palette className="w-4 h-4 text-indigo-500" />
            <span>Focus Themes</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold">
              Upcoming
            </span>
          </button>

          <button
            id="store-tab-audio"
            type="button"
            onClick={() => setSelectedCategory('audio')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              selectedCategory === 'audio'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Headphones className="w-4 h-4 text-amber-500" />
            <span>Audio Ambience</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-bold">
              Upcoming
            </span>
          </button>
        </div>
      </div>

      {/* Tree Species Catalog Section */}
      {(selectedCategory === 'all' || selectedCategory === 'trees') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold font-display text-slate-900 flex items-center gap-2">
              <Trees className="w-5 h-5 text-emerald-600" />
              <span>Tree Species ({totalSpeciesCount} Species)</span>
            </h2>
            <span className="text-xs text-slate-500">
              {unlockedCount} unlocked in your seedbag
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {TREE_SPECIES_CATALOG.map((spec) => {
              const isUnlocked = unlockedSpecies.includes(spec.id);
              const canAfford = coins >= spec.price;
              const isJustBought = purchaseSuccessItem === spec.id;

              return (
                <div
                  key={spec.id}
                  id={`store-item-tree-${spec.id.toLowerCase().replace(/\s+/g, '-')}`}
                  className={`p-5 rounded-2xl bg-white border flex flex-col justify-between transition-all duration-200 ${
                    isJustBought
                      ? 'ring-2 ring-emerald-500 border-emerald-400 shadow-md'
                      : isUnlocked
                      ? 'border-slate-200 shadow-xs hover:border-emerald-300'
                      : 'border-slate-200 shadow-2xs hover:border-amber-300'
                  }`}
                >
                  <div>
                    {/* Header Badges */}
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          spec.isFree
                            ? 'bg-emerald-100 text-emerald-800'
                            : spec.category === 'exotic'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {spec.isFree ? 'Free Starter' : spec.category.toUpperCase()}
                      </span>

                      {spec.isFree ? (
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          Free Forever
                        </span>
                      ) : (
                        <span className="text-xs font-extrabold text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200 flex items-center gap-1">
                          <span>🪙</span>
                          <span>{spec.price} Coins</span>
                        </span>
                      )}
                    </div>

                    {/* Tree Illustration */}
                    <div className="h-44 flex items-center justify-center my-3 bg-gradient-to-b from-slate-50/50 to-slate-100/60 rounded-xl border border-slate-100">
                      <TreeIllustration
                        progressPercent={100}
                        species={spec.id}
                        size="md"
                        className="transition-transform duration-300 hover:scale-110"
                      />
                    </div>

                    {/* Title & Description */}
                    <h3 className="font-bold text-base font-display text-slate-900">
                      {spec.name}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {spec.description}
                    </p>
                  </div>

                  {/* Buy / Owned Action */}
                  <div className="mt-5 pt-3 border-t border-slate-100">
                    {isUnlocked ? (
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-200">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Owned in Seedbag</span>
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          Select in Focus
                        </span>
                      </div>
                    ) : (
                      <div>
                        {canAfford ? (
                          <button
                            id={`store-buy-${spec.id.toLowerCase().replace(/\s+/g, '-')}`}
                            type="button"
                            onClick={() => handleBuySpecies(spec.id, spec.price)}
                            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Unlock for {spec.price} 🪙</span>
                          </button>
                        ) : (
                          <div className="space-y-1">
                            <button
                              disabled
                              className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-slate-100 text-slate-400 font-semibold text-xs cursor-not-allowed border border-slate-200"
                            >
                              <Lock className="w-3.5 h-3.5" />
                              <span>Need {spec.price - coins} More 🪙</span>
                            </button>
                            <p className="text-[10px] text-center text-slate-400 font-medium">
                              Complete academic tasks to earn coins
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming Items: Focus Themes & Ambience */}
      {(selectedCategory === 'all' || selectedCategory === 'themes' || selectedCategory === 'audio') && (
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold font-display text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <span>Future Catalog & Accessories</span>
            </h2>
            <span className="text-xs text-slate-500">
              Expanding soon as semester progresses
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {UPCOMING_STORE_ITEMS.filter((item) => {
              if (selectedCategory === 'themes') return item.category === 'themes';
              if (selectedCategory === 'audio') return item.category === 'audio';
              return true;
            }).map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className="p-5 rounded-2xl bg-white/70 border border-slate-200/80 shadow-2xs flex flex-col justify-between opacity-90"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {item.badge}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-slate-900">{item.name}</h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900 flex items-center gap-1">
                      <span>🪙</span>
                      <span>{item.price} Coins</span>
                    </span>
                    <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                      In Development
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
