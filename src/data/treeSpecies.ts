import { TreeSpecies, TreeSpeciesInfo } from '../types';

export const TREE_SPECIES_CATALOG: TreeSpeciesInfo[] = [
  // 3 FREE STARTER TREES
  {
    id: 'Oak',
    name: 'Academic Oak',
    description: 'A classic, sturdy canopy with lush green foliage representing foundational knowledge.',
    price: 0,
    isFree: true,
    category: 'starter',
  },
  {
    id: 'Pine',
    name: 'Resilient Pine',
    description: 'Crisp evergreen needles symbolizing endurance through tough problem sets.',
    price: 0,
    isFree: true,
    category: 'starter',
  },
  {
    id: 'Birch',
    name: 'Silver Birch',
    description: 'Slender pale bark with bright lime leaves for lightweight, agile focus sprints.',
    price: 0,
    isFree: true,
    category: 'starter',
  },

  // UNLOCKABLE WITH STUDY COINS (Earned at rate of 5 coins per 60 min)
  {
    id: 'Cherry Blossom',
    name: 'Sakura Blossom',
    description: 'Delicate pink petals radiating zen calm and post-exam relief.',
    price: 15,
    isFree: false,
    category: 'exotic',
  },
  {
    id: 'Bonsai',
    name: 'Zen Master Bonsai',
    description: 'Artfully sculpted ancient bonsai requiring deep meditation and precision.',
    price: 25,
    isFree: false,
    category: 'exotic',
  },
  {
    id: 'Maple',
    name: 'Crimson Autumn Maple',
    description: 'Fiery amber-orange foliage celebrating milestone task achievements.',
    price: 35,
    isFree: false,
    category: 'exotic',
  },
  {
    id: 'Golden Ginkgo',
    name: 'Golden Ginkgo',
    description: 'Prehistoric fan-shaped leaves that turn luminous pure gold during deep flow.',
    price: 50,
    isFree: false,
    category: 'legendary',
  },
  {
    id: 'Willow',
    name: 'Weeping River Willow',
    description: 'Graceful sweeping tendrils providing a tranquil haven against academic stress.',
    price: 65,
    isFree: false,
    category: 'legendary',
  },
  {
    id: 'Redwood',
    name: 'Giant Sequoia Redwood',
    description: 'Monumental ancient giant forged through marathon exam preparation.',
    price: 80,
    isFree: false,
    category: 'legendary',
  },
];

export const DEFAULT_UNLOCKED_SPECIES: TreeSpecies[] = ['Oak', 'Pine', 'Birch'];

export const DEFAULT_SPECIES_BY_COURSE: Record<string, TreeSpecies> = {
  Calculus: 'Oak',
  Physics: 'Pine',
  Programming: 'Birch',
  Mechanics: 'Oak',
  Electronics: 'Pine',
};
