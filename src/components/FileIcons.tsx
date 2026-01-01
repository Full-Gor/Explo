import React from 'react';
import Svg, {
  Path,
  Rect,
  Circle,
  Ellipse,
  Line,
  Text as SvgText,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import { colors } from '../theme/colors';

interface IconProps {
  size?: number;
  color?: string;
}

export function FolderIcon({ size = 40, color = colors.folderOrange }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <Path
        d="M4 12C4 9.79086 5.79086 8 8 8H14.5858C15.1162 8 15.6249 8.21071 16 8.58579L18.4142 11H32C34.2091 11 36 12.7909 36 15V28C36 30.2091 34.2091 32 32 32H8C5.79086 32 4 30.2091 4 28V12Z"
        fill={color}
      />
      <Path
        d="M4 14H36V28C36 30.2091 34.2091 32 32 32H8C5.79086 32 4 30.2091 4 28V14Z"
        fill={color}
        fillOpacity={0.9}
      />
    </Svg>
  );
}

export function ImageIcon({ size = 40 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <Rect x={4} y={8} width={32} height={24} rx={4} fill={colors.imageBlue} />
      <Circle cx={12} cy={16} r={3} fill={colors.folderOrange} />
      <Path
        d="M4 26L14 18L22 24L28 20L36 26V28C36 30.2091 34.2091 32 32 32H8C5.79086 32 4 30.2091 4 28V26Z"
        fill={colors.success}
      />
      <Path
        d="M22 24L28 20L36 26V28C36 30.2091 34.2091 32 32 32H8L22 24Z"
        fill={colors.successDark}
      />
    </Svg>
  );
}

export function AudioIcon({ size = 40 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <Rect x={4} y={4} width={32} height={32} rx={8} fill="#1A1A2E" />
      <Rect x={10} y={14} width={3} height={12} rx={1.5} fill={colors.audioRed} />
      <Rect x={15} y={10} width={3} height={20} rx={1.5} fill={colors.audioRed} />
      <Rect x={20} y={16} width={3} height={8} rx={1.5} fill={colors.audioPurple} />
      <Rect x={25} y={12} width={3} height={16} rx={1.5} fill={colors.audioPurple} />
      <Rect x={30} y={18} width={3} height={4} rx={1.5} fill={colors.audioPurple} />
    </Svg>
  );
}

export function ChartIcon({ size = 40 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <Defs>
        <LinearGradient id="chartGrad" x1={8} y1={28} x2={32} y2={14}>
          <Stop offset={0} stopColor={colors.accentGradientStart} />
          <Stop offset={1} stopColor={colors.accentGradientEnd} />
        </LinearGradient>
      </Defs>
      <Rect x={4} y={4} width={32} height={32} rx={8} fill="#F8F9FA" />
      <Path
        d="M8 28C12 28 14 20 18 18C22 16 26 22 32 14"
        stroke="url(#chartGrad)"
        strokeWidth={3}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}

export function DocumentIcon({ size = 40 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <Rect x={4} y={4} width={32} height={32} rx={6} fill={colors.documentGray} />
      <SvgText
        x={20}
        y={28}
        textAnchor="middle"
        fill={colors.white}
        fontSize={20}
        fontWeight="bold"
      >
        T
      </SvgText>
    </Svg>
  );
}

export function ArchiveIcon({ size = 36 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <Rect x={2} y={6} width={32} height={24} rx={4} fill={colors.imageBlue} />
      <Rect x={6} y={10} width={24} height={16} rx={2} fill="#5BA0F2" />
      <Path d="M14 14H22V18H14V14Z" fill={colors.white} fillOpacity={0.3} />
    </Svg>
  );
}

export function DropboxIcon({ size = 36 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <Path d="M9 8L18 14L27 8L18 2L9 8Z" fill={colors.dropboxBlue} />
      <Path d="M9 20L18 14L27 20L18 26L9 20Z" fill={colors.dropboxBlue} />
      <Path d="M9 8L0 14L9 20L18 14L9 8Z" fill={colors.dropboxBlue} />
      <Path d="M27 8L36 14L27 20L18 14L27 8Z" fill={colors.dropboxBlue} />
      <Path d="M18 28L9 22L18 16L27 22L18 28Z" fill={colors.dropboxBlue} fillOpacity={0.7} />
    </Svg>
  );
}

export function LightbulbIcon({ size = 36 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <Defs>
        <LinearGradient id="bulbGrad" x1={18} y1={2} x2={18} y2={26}>
          <Stop offset={0} stopColor="#FFE066" />
          <Stop offset={1} stopColor="#FFD93D" />
        </LinearGradient>
      </Defs>
      <Ellipse cx={18} cy={14} rx={10} ry={12} fill="url(#bulbGrad)" />
      <Rect x={14} y={24} width={8} height={6} rx={2} fill="#FFD93D" />
    </Svg>
  );
}

export function ColorWheelIcon({ size = 36 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <Circle cx={18} cy={18} r={14} fill="none" />
      <Path d="M18 4A14 14 0 0 1 32 18L18 18Z" fill="#FF6B6B" />
      <Path d="M32 18A14 14 0 0 1 18 32L18 18Z" fill="#4ECDC4" />
      <Path d="M18 32A14 14 0 0 1 4 18L18 18Z" fill="#45B7D1" />
      <Path d="M4 18A14 14 0 0 1 18 4L18 18Z" fill="#96CEB4" />
      <Circle cx={18} cy={18} r={5} fill={colors.white} />
    </Svg>
  );
}

export function GlobeIcon({ size = 36 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <Defs>
        <LinearGradient id="globeGrad" x1={4} y1={4} x2={32} y2={32}>
          <Stop offset={0} stopColor={colors.accentGradientStart} />
          <Stop offset={1} stopColor={colors.accentGradientEnd} />
        </LinearGradient>
      </Defs>
      <Circle cx={18} cy={18} r={14} fill="url(#globeGrad)" />
      <Ellipse
        cx={18}
        cy={18}
        rx={6}
        ry={14}
        stroke={colors.white}
        strokeWidth={1.5}
        fill="none"
      />
      <Line x1={4} y1={18} x2={32} y2={18} stroke={colors.white} strokeWidth={1.5} />
      <Ellipse
        cx={18}
        cy={10}
        rx={10}
        ry={3}
        stroke={colors.white}
        strokeWidth={1}
        fill="none"
      />
      <Ellipse
        cx={18}
        cy={26}
        rx={10}
        ry={3}
        stroke={colors.white}
        strokeWidth={1}
        fill="none"
      />
    </Svg>
  );
}

export function FiletypeIcon({ size = 36 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <Rect x={6} y={2} width={18} height={24} rx={3} fill="#E8E8E8" />
      <Rect x={12} y={10} width={18} height={24} rx={3} fill="#4ECDC4" />
      <Rect x={15} y={16} width={12} height={2} rx={1} fill={colors.white} />
      <Rect x={15} y={20} width={8} height={2} rx={1} fill={colors.white} fillOpacity={0.7} />
    </Svg>
  );
}

export function AppIcon({ size = 36 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <Rect x={4} y={4} width={12} height={12} rx={3} fill="#FF6B6B" />
      <Rect x={20} y={4} width={12} height={12} rx={3} fill="#F8E8E8" />
      <Rect x={4} y={20} width={12} height={12} rx={3} fill="#F8E8E8" />
      <Rect x={20} y={20} width={12} height={12} rx={3} fill="#4ECDC4" />
    </Svg>
  );
}

export function SyncIcon({ size = 24, color = colors.syncBlue }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 12C4 7.58172 7.58172 4 12 4C14.5 4 16.7 5.1 18.2 6.8L16 9H22V3L19.6 5.4C17.7 3.3 15 2 12 2C6.48 2 2 6.48 2 12H4Z"
        fill={color}
      />
      <Path
        d="M20 12C20 16.4183 16.4183 20 12 20C9.5 20 7.3 18.9 5.8 17.2L8 15H2V21L4.4 18.6C6.3 20.7 9 22 12 22C17.52 22 22 17.52 22 12H20Z"
        fill={color}
      />
    </Svg>
  );
}

export function HomeIcon({ size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 12L12 3L21 12V21H15V15H9V21H3V12Z"
        fill={colors.textDim}
      />
    </Svg>
  );
}

export function MenuIcon({ size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={4} y={6} width={16} height={2} rx={1} fill={colors.white} />
      <Rect x={4} y={11} width={16} height={2} rx={1} fill={colors.white} />
    </Svg>
  );
}

export function ClockIcon({ size = 16 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Circle
        cx={8}
        cy={8}
        r={6}
        stroke={colors.textMuted}
        strokeWidth={1.5}
        fill="none"
      />
      <Path
        d="M8 4V8L10.5 10.5"
        stroke={colors.textMuted}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export const FileIcons = {
  FolderIcon,
  ImageIcon,
  AudioIcon,
  ChartIcon,
  DocumentIcon,
  ArchiveIcon,
  DropboxIcon,
  LightbulbIcon,
  ColorWheelIcon,
  GlobeIcon,
  FiletypeIcon,
  AppIcon,
  SyncIcon,
  HomeIcon,
  MenuIcon,
  ClockIcon,
};
