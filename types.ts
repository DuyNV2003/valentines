export enum AppState {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  GENERATING = 'GENERATING',
  DISPLAY = 'DISPLAY'
}

export interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
  twinkleSpeed: number;
}

export interface Heart {
  x: number;
  y: number;
  size: number;
  speedY: number; // Vertical falling speed
  speedX: number; // Horizontal drift
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  color: string;
  wobble: number; // For sine wave movement
}

export interface ShootingStar {
  id: number;
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number;
  opacity: number;
}

export interface Theme {
  id: string;
  name: string;
  primary: string;   // Main dust color / Planet base
  secondary: string; // Secondary dust color
  accent: string;    // Heart / Bright stars
  dark: string;      // Planet shadow / Dark gradient
  bgGradientStart: string;
  bgGradientEnd: string;
  starColor: string;
}

export const THEMES: Theme[] = [
  {
    id: 'passion',
    name: 'Tình Yêu Nồng Nàn',
    primary: '#ec4899', // Pink-500
    secondary: '#fbcfe8', // Pink-200
    accent: '#e11d48', // Red-600
    dark: '#500724', // Pink-950
    bgGradientStart: '#1f0a15',
    bgGradientEnd: '#000000',
    starColor: '#6366f1' // Indigo
  },
  {
    id: 'ocean',
    name: 'Đại Dương Vĩnh Cửu',
    primary: '#0ea5e9', // Sky-500
    secondary: '#bae6fd', // Sky-200
    accent: '#38bdf8', // Sky-400
    dark: '#082f49', // Sky-950
    bgGradientStart: '#0c1a2e',
    bgGradientEnd: '#000000',
    starColor: '#ffffff'
  },
  {
    id: 'mystic',
    name: 'Tím Mộng Mơ',
    primary: '#a855f7', // Purple-500
    secondary: '#e9d5ff', // Purple-200
    accent: '#d8b4fe', // Purple-300
    dark: '#3b0764', // Purple-950
    bgGradientStart: '#180a29',
    bgGradientEnd: '#000000',
    starColor: '#f472b6'
  },
  {
    id: 'golden',
    name: 'Hoàng Kim Rực Rỡ',
    primary: '#f59e0b', // Amber-500
    secondary: '#fde68a', // Amber-200
    accent: '#fbbf24', // Amber-400
    dark: '#451a03', // Amber-950
    bgGradientStart: '#271300',
    bgGradientEnd: '#000000',
    starColor: '#fcd34d'
  },
  {
    id: 'galaxy',
    name: 'Ngân Hà Bí Ẩn',
    primary: '#14b8a6', // Teal-500
    secondary: '#99f6e4', // Teal-200
    accent: '#f0abfc', // Fuchsia-300
    dark: '#042f2e', // Teal-950
    bgGradientStart: '#022c22',
    bgGradientEnd: '#000000',
    starColor: '#5eead4' // Teal-300
  }
];