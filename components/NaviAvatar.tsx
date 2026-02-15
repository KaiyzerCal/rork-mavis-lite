import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Platform, Animated, Easing } from 'react-native';
import Svg, { Path, Circle, Ellipse, Defs, LinearGradient, Stop, G, Rect, Polygon, Line, RadialGradient } from 'react-native-svg';

export type NaviAvatarStyle = 
  | 'classic' 
  | 'cyber' 
  | 'guardian' 
  | 'sage' 
  | 'phantom' 
  | 'nova' 
  | 'sentinel'
  | 'oracle'
  | 'nexus'
  | 'prism'
  | 'warrior_male'
  | 'warrior_female'
  | 'mecha_unit'
  | 'beast_wolf'
  | 'beast_dragon'
  | 'demon_lord'
  | 'angel_seraph'
  | 'alien_grey'
  | 'alien_nova'
  | 'slime_cute'
  | 'golem_stone'
  | 'spirit_flame'
  | 'spirit_ice'
  | 'assassin'
  | 'paladin'
  | 'animal_dolphin'
  | 'animal_seahorse'
  | 'animal_turtle'
  | 'animal_fox'
  | 'animal_lion'
  | 'animal_tiger'
  | 'animal_bear'
  | 'animal_butterfly'
  | 'animal_dragonfly'
  | 'animal_bull'
  | 'animal_shark'
  | 'animal_tarantula'
  | 'animal_phoenix'
  | 'animal_snake';

interface NaviAvatarProps {
  type?: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  shape?: 'circle' | 'rounded-square' | 'hexagon' | 'diamond';
  size?: number;
  style?: NaviAvatarStyle;
  glowEnabled?: boolean;
}

export default function NaviAvatar({
  primaryColor,
  secondaryColor,
  backgroundColor,
  size = 80,
  style = 'classic',
  glowEnabled = true,
}: NaviAvatarProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.12)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const orbAnim1 = useRef(new Animated.Value(0)).current;
  const orbAnim2 = useRef(new Animated.Value(0)).current;
  const orbAnim3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const breathe = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.04,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 0.28,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.12,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const float = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -4,
          duration: 2800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 4,
          duration: 2800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const orbit1 = Animated.loop(
      Animated.timing(orbAnim1, {
        toValue: 1,
        duration: 6000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    const orbit2 = Animated.loop(
      Animated.timing(orbAnim2, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    const orbit3 = Animated.loop(
      Animated.timing(orbAnim3, {
        toValue: 1,
        duration: 10000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    breathe.start();
    glow.start();
    float.start();
    orbit1.start();
    orbit2.start();
    orbit3.start();

    return () => {
      breathe.stop();
      glow.stop();
      float.stop();
      orbit1.stop();
      orbit2.stop();
      orbit3.stop();
    };
  }, []);

  const orb1TranslateX = orbAnim1.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [0, size * 0.55, 0, -size * 0.55, 0],
  });
  const orb1TranslateY = orbAnim1.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [-size * 0.55, 0, size * 0.55, 0, -size * 0.55],
  });
  const orb2TranslateX = orbAnim2.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [size * 0.45, 0, -size * 0.45, 0, size * 0.45],
  });
  const orb2TranslateY = orbAnim2.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [0, -size * 0.45, 0, size * 0.45, 0],
  });
  const orb3TranslateX = orbAnim3.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [-size * 0.35, size * 0.35, size * 0.35, -size * 0.35, -size * 0.35],
  });
  const orb3TranslateY = orbAnim3.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [-size * 0.35, -size * 0.35, size * 0.35, size * 0.35, -size * 0.35],
  });

  const orb1Opacity = orbAnim1.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [0.6, 1, 0.6, 1, 0.6],
  });
  const orb2Opacity = orbAnim2.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [1, 0.5, 1, 0.5, 1],
  });
  const orb3Opacity = orbAnim3.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.4, 0.9, 0.4],
  });

  const renderNaviBody = () => {
    switch (style) {
      case 'warrior_male':
        return (
          <G>
            <Rect x="38" y="10" width="24" height="8" rx="2" fill={secondaryColor} />
            <Path d="M35 18 Q50 12 65 18 L62 22 L38 22 Z" fill={secondaryColor} />
            <Ellipse cx="50" cy="32" rx="16" ry="18" fill={primaryColor} />
            <Circle cx="50" cy="30" r="13" fill={backgroundColor} />
            <Rect x="42" y="26" width="5" height="7" rx="1" fill={primaryColor} />
            <Rect x="53" y="26" width="5" height="7" rx="1" fill={primaryColor} />
            <Circle cx="44" cy="28" r="2" fill="#ffffff" />
            <Circle cx="56" cy="28" r="2" fill="#ffffff" />
            <Path d="M46 38 L50 40 L54 38" stroke={primaryColor} strokeWidth="2" fill="none" />
            <Rect x="25" y="16" width="8" height="3" rx="1" fill={secondaryColor} />
            <Rect x="67" y="16" width="8" height="3" rx="1" fill={secondaryColor} />
            <Path d="M32 48 L38 45 L50 48 L62 45 L68 48 L70 90 Q50 98 30 90 Z" fill={primaryColor} />
            <Path d="M38 50 L38 75" stroke={secondaryColor} strokeWidth="3" />
            <Path d="M62 50 L62 75" stroke={secondaryColor} strokeWidth="3" />
            <Rect x="42" y="52" width="16" height="12" rx="2" fill={secondaryColor} />
            <Circle cx="50" cy="58" r="4" fill={backgroundColor} />
            <Path d="M22 52 L32 48 L35 65 L25 70 Z" fill={primaryColor} />
            <Path d="M78 52 L68 48 L65 65 L75 70 Z" fill={primaryColor} />
          </G>
        );

      case 'warrior_female':
        return (
          <G>
            <Path d="M30 25 Q35 8 50 8 Q65 8 70 25 L72 45 Q70 50 65 48 L62 30 L38 30 L35 48 Q30 50 28 45 Z" fill={secondaryColor} />
            <Path d="M28 40 Q25 55 30 70" stroke={secondaryColor} strokeWidth="3" fill="none" />
            <Path d="M72 40 Q75 55 70 70" stroke={secondaryColor} strokeWidth="3" fill="none" />
            <Ellipse cx="50" cy="32" rx="14" ry="16" fill={primaryColor} />
            <Circle cx="50" cy="30" r="12" fill={backgroundColor} />
            <Ellipse cx="44" cy="28" rx="3" ry="4" fill={primaryColor} />
            <Ellipse cx="56" cy="28" rx="3" ry="4" fill={primaryColor} />
            <Circle cx="44" cy="27" r="1.5" fill="#ffffff" />
            <Circle cx="56" cy="27" r="1.5" fill="#ffffff" />
            <Path d="M47 36 Q50 38 53 36" stroke={primaryColor} strokeWidth="1.5" fill="none" />
            <Ellipse cx="41" cy="32" rx="2" ry="1" fill="#fca5a5" opacity={0.6} />
            <Ellipse cx="59" cy="32" rx="2" ry="1" fill="#fca5a5" opacity={0.6} />
            <Path d="M35 48 Q50 42 65 48 L68 58 Q65 62 60 60 L58 55 L50 52 L42 55 L40 60 Q35 62 32 58 Z" fill={primaryColor} />
            <Path d="M32 58 Q50 52 68 58 L65 92 Q50 100 35 92 Z" fill={primaryColor} />
            <Ellipse cx="50" cy="62" rx="8" ry="5" fill={secondaryColor} />
            <Circle cx="50" cy="62" r="3" fill={backgroundColor} />
            <Path d="M40 72 L60 72" stroke={secondaryColor} strokeWidth="2" />
            <Path d="M42 80 L58 80" stroke={secondaryColor} strokeWidth="1.5" opacity={0.7} />
          </G>
        );

      case 'mecha_unit':
        return (
          <G>
            <Rect x="35" y="8" width="30" height="6" rx="1" fill={secondaryColor} />
            <Path d="M32 14 L68 14 L72 20 L28 20 Z" fill={primaryColor} />
            <Rect x="30" y="20" width="40" height="35" rx="3" fill={primaryColor} />
            <Rect x="34" y="24" width="32" height="26" rx="2" fill={backgroundColor} />
            <Rect x="38" y="28" width="10" height="8" rx="1" fill={primaryColor} />
            <Rect x="52" y="28" width="10" height="8" rx="1" fill={primaryColor} />
            <Circle cx="43" cy="32" r="3" fill="#ff0000" />
            <Circle cx="57" cy="32" r="3" fill="#ff0000" />
            <Circle cx="43" cy="31" r="1" fill="#ffffff" />
            <Circle cx="57" cy="31" r="1" fill="#ffffff" />
            <Rect x="40" y="42" width="20" height="4" rx="1" fill={primaryColor} />
            <Line x1="42" y1="44" x2="58" y2="44" stroke={secondaryColor} strokeWidth="1" />
            <Rect x="22" y="24" width="8" height="25" rx="2" fill={primaryColor} />
            <Rect x="70" y="24" width="8" height="25" rx="2" fill={primaryColor} />
            <Rect x="24" y="28" width="4" height="8" rx="1" fill={secondaryColor} />
            <Rect x="72" y="28" width="4" height="8" rx="1" fill={secondaryColor} />
            <Rect x="28" y="55" width="44" height="40" rx="3" fill={primaryColor} />
            <Rect x="32" y="58" width="36" height="10" rx="2" fill={secondaryColor} />
            <Circle cx="50" cy="63" r="4" fill={backgroundColor} />
            <Rect x="35" y="72" width="30" height="4" rx="1" fill={secondaryColor} opacity={0.8} />
            <Rect x="38" y="80" width="24" height="3" rx="1" fill={secondaryColor} opacity={0.6} />
            <Rect x="40" y="87" width="20" height="3" rx="1" fill={secondaryColor} opacity={0.4} />
          </G>
        );

      case 'beast_wolf':
        return (
          <G>
            <Path d="M25 25 L35 10 L40 25 Z" fill={primaryColor} />
            <Path d="M75 25 L65 10 L60 25 Z" fill={primaryColor} />
            <Path d="M28 22 L37 12 L42 22" stroke={secondaryColor} strokeWidth="2" fill="none" />
            <Path d="M72 22 L63 12 L58 22" stroke={secondaryColor} strokeWidth="2" fill="none" />
            <Ellipse cx="50" cy="38" rx="25" ry="22" fill={primaryColor} />
            <Ellipse cx="50" cy="35" rx="18" ry="16" fill={backgroundColor} />
            <Ellipse cx="40" cy="32" rx="6" ry="7" fill={primaryColor} />
            <Ellipse cx="60" cy="32" rx="6" ry="7" fill={primaryColor} />
            <Ellipse cx="40" cy="31" rx="3" ry="4" fill="#fbbf24" />
            <Ellipse cx="60" cy="31" rx="3" ry="4" fill="#fbbf24" />
            <Circle cx="40" cy="30" r="1.5" fill="#000000" />
            <Circle cx="60" cy="30" r="1.5" fill="#000000" />
            <Ellipse cx="50" cy="42" rx="8" ry="6" fill={primaryColor} />
            <Ellipse cx="50" cy="44" rx="4" ry="3" fill="#1f2937" />
            <Path d="M42 48 L46 52 L50 50 L54 52 L58 48" stroke={primaryColor} strokeWidth="2" fill="none" />
            <Path d="M35 55 Q50 48 65 55 L68 88 Q50 98 32 88 Z" fill={primaryColor} />
            <Path d="M40 60 L50 55 L60 60" stroke={secondaryColor} strokeWidth="2" fill="none" />
            <Ellipse cx="50" cy="72" rx="12" ry="8" fill={backgroundColor} opacity={0.5} />
            <Path d="M38 68 Q50 62 62 68 Q60 82 50 85 Q40 82 38 68" fill={secondaryColor} opacity={0.3} />
          </G>
        );

      case 'beast_dragon':
        return (
          <G>
            <Path d="M20 30 L28 8 L35 25 L32 30 Z" fill={secondaryColor} />
            <Path d="M80 30 L72 8 L65 25 L68 30 Z" fill={secondaryColor} />
            <Path d="M28 25 L25 15 L32 22" stroke={primaryColor} strokeWidth="2" fill="none" />
            <Path d="M72 25 L75 15 L68 22" stroke={primaryColor} strokeWidth="2" fill="none" />
            <Ellipse cx="50" cy="40" rx="26" ry="24" fill={primaryColor} />
            <Path d="M28 35 Q50 20 72 35 L70 50 Q50 42 30 50 Z" fill={secondaryColor} opacity={0.3} />
            <Ellipse cx="50" cy="38" rx="18" ry="16" fill={backgroundColor} />
            <Path d="M36 32 L40 28 L44 32 L40 35 Z" fill={primaryColor} />
            <Path d="M56 32 L60 28 L64 32 L60 35 Z" fill={primaryColor} />
            <Ellipse cx="40" cy="31" rx="2.5" ry="3" fill="#dc2626" />
            <Ellipse cx="60" cy="31" rx="2.5" ry="3" fill="#dc2626" />
            <Circle cx="40" cy="30" r="1" fill="#fbbf24" />
            <Circle cx="60" cy="30" r="1" fill="#fbbf24" />
            <Ellipse cx="50" cy="44" rx="6" ry="4" fill={primaryColor} />
            <Path d="M44 48 L50 52 L56 48" stroke={primaryColor} strokeWidth="2" fill="none" />
            <Path d="M30 58 Q50 50 70 58 L72 92 Q50 102 28 92 Z" fill={primaryColor} />
            <Path d="M35 62 L50 56 L65 62" stroke={secondaryColor} strokeWidth="2" fill="none" />
            <Path d="M38 70 L50 65 L62 70" stroke={secondaryColor} strokeWidth="1.5" fill="none" opacity={0.8} />
            <Path d="M40 78 L50 74 L60 78" stroke={secondaryColor} strokeWidth="1.5" fill="none" opacity={0.6} />
            <Ellipse cx="50" cy="75" rx="8" ry="6" fill={secondaryColor} opacity={0.4} />
          </G>
        );

      case 'demon_lord':
        return (
          <G>
            <Path d="M22 40 L30 5 L38 30 L32 38 Z" fill={secondaryColor} />
            <Path d="M78 40 L70 5 L62 30 L68 38 Z" fill={secondaryColor} />
            <Path d="M28 32 L32 10 L36 28" stroke="#dc2626" strokeWidth="2" fill="none" />
            <Path d="M72 32 L68 10 L64 28" stroke="#dc2626" strokeWidth="2" fill="none" />
            <Ellipse cx="50" cy="42" rx="22" ry="24" fill={primaryColor} />
            <Circle cx="50" cy="40" r="16" fill={backgroundColor} />
            <Path d="M38 36 L42 32 L46 36 L42 40 Z" fill="#dc2626" />
            <Path d="M54 36 L58 32 L62 36 L58 40 Z" fill="#dc2626" />
            <Ellipse cx="42" cy="36" rx="2" ry="3" fill="#fbbf24" />
            <Ellipse cx="58" cy="36" rx="2" ry="3" fill="#fbbf24" />
            <Circle cx="42" cy="35" r="1" fill="#000000" />
            <Circle cx="58" cy="35" r="1" fill="#000000" />
            <Path d="M44 50 L46 48 L50 50 L54 48 L56 50" stroke={secondaryColor} strokeWidth="2" fill="none" />
            <Path d="M42 52 L44 50 M56 52 L58 50" stroke={secondaryColor} strokeWidth="1.5" />
            <Path d="M30 62 Q50 54 70 62 L72 95 Q50 105 28 95 Z" fill={primaryColor} />
            <Path d="M50 60 L50 88" stroke={secondaryColor} strokeWidth="3" />
            <Polygon points="50,65 58,72 58,82 50,88 42,82 42,72" fill={secondaryColor} />
            <Circle cx="50" cy="76" r="5" fill="#dc2626" />
            <Circle cx="50" cy="76" r="2" fill={backgroundColor} />
          </G>
        );

      case 'angel_seraph':
        return (
          <G>
            <Circle cx="50" cy="12" r="8" fill="none" stroke={secondaryColor} strokeWidth="3" />
            <Circle cx="50" cy="12" r="5" fill={secondaryColor} opacity={0.3} />
            <Path d="M18 50 Q25 30 35 40 L38 50 Q30 55 22 55 Z" fill={secondaryColor} opacity={0.8} />
            <Path d="M82 50 Q75 30 65 40 L62 50 Q70 55 78 55 Z" fill={secondaryColor} opacity={0.8} />
            <Path d="M15 60 Q22 38 32 48 L35 58 Q28 62 20 62 Z" fill={secondaryColor} opacity={0.6} />
            <Path d="M85 60 Q78 38 68 48 L65 58 Q72 62 80 62 Z" fill={secondaryColor} opacity={0.6} />
            <Ellipse cx="50" cy="38" rx="16" ry="18" fill={primaryColor} />
            <Circle cx="50" cy="36" r="13" fill={backgroundColor} />
            <Ellipse cx="44" cy="34" rx="4" ry="5" fill={primaryColor} />
            <Ellipse cx="56" cy="34" rx="4" ry="5" fill={primaryColor} />
            <Circle cx="44" cy="33" r="2" fill="#ffffff" />
            <Circle cx="56" cy="33" r="2" fill="#ffffff" />
            <Circle cx="45" cy="32" r="0.8" fill={secondaryColor} />
            <Circle cx="57" cy="32" r="0.8" fill={secondaryColor} />
            <Path d="M46 44 Q50 47 54 44" stroke={primaryColor} strokeWidth="1.5" fill="none" />
            <Path d="M35 55 Q50 48 65 55 L65 92 Q50 100 35 92 Z" fill={primaryColor} />
            <Ellipse cx="50" cy="65" rx="10" ry="8" fill={backgroundColor} opacity={0.5} />
            <Circle cx="50" cy="65" r="5" fill={secondaryColor} />
            <Circle cx="50" cy="65" r="2" fill="#ffffff" />
            <Path d="M40 78 L60 78" stroke={secondaryColor} strokeWidth="2" opacity={0.6} />
            <Path d="M42 85 L58 85" stroke={secondaryColor} strokeWidth="1.5" opacity={0.4} />
          </G>
        );

      case 'alien_grey':
        return (
          <G>
            <Ellipse cx="50" cy="40" rx="24" ry="30" fill={primaryColor} />
            <Ellipse cx="50" cy="38" rx="20" ry="26" fill={backgroundColor} />
            <Ellipse cx="38" cy="35" rx="10" ry="14" fill="#1f2937" />
            <Ellipse cx="62" cy="35" rx="10" ry="14" fill="#1f2937" />
            <Ellipse cx="38" cy="33" rx="6" ry="8" fill={primaryColor} opacity={0.3} />
            <Ellipse cx="62" cy="33" rx="6" ry="8" fill={primaryColor} opacity={0.3} />
            <Ellipse cx="36" cy="30" rx="2" ry="3" fill="#ffffff" opacity={0.8} />
            <Ellipse cx="60" cy="30" rx="2" ry="3" fill="#ffffff" opacity={0.8} />
            <Path d="M46 55 Q50 58 54 55" stroke={primaryColor} strokeWidth="1" fill="none" />
            <Ellipse cx="50" cy="58" rx="2" ry="1" fill={primaryColor} />
            <Path d="M38 68 Q50 62 62 68 L60 95 Q50 102 40 95 Z" fill={primaryColor} />
            <Ellipse cx="50" cy="78" rx="8" ry="6" fill={backgroundColor} opacity={0.4} />
            <Circle cx="50" cy="78" r="3" fill={secondaryColor} />
            <Path d="M44 85 L56 85" stroke={secondaryColor} strokeWidth="1.5" opacity={0.5} />
            <Path d="M25 70 L38 68 L35 80 L22 82 Z" fill={primaryColor} opacity={0.8} />
            <Path d="M75 70 L62 68 L65 80 L78 82 Z" fill={primaryColor} opacity={0.8} />
          </G>
        );

      case 'alien_nova':
        return (
          <G>
            <Circle cx="50" cy="10" r="5" fill={secondaryColor} opacity={0.6} />
            <Path d="M50 15 L50 22" stroke={secondaryColor} strokeWidth="2" />
            <Ellipse cx="50" cy="40" rx="22" ry="24" fill={primaryColor} />
            <Ellipse cx="50" cy="38" rx="18" ry="20" fill={backgroundColor} />
            <Path d="M32 30 Q50 20 68 30" stroke={secondaryColor} strokeWidth="2" fill="none" />
            <Circle cx="40" cy="35" r="8" fill={primaryColor} />
            <Circle cx="60" cy="35" r="8" fill={primaryColor} />
            <Circle cx="40" cy="35" r="5" fill={secondaryColor} />
            <Circle cx="60" cy="35" r="5" fill={secondaryColor} />
            <Circle cx="40" cy="35" r="2" fill="#ffffff" />
            <Circle cx="60" cy="35" r="2" fill="#ffffff" />
            <Path d="M44 50 Q50 54 56 50" stroke={primaryColor} strokeWidth="2" fill="none" />
            <Path d="M32 60 Q50 52 68 60 L68 92 Q50 102 32 92 Z" fill={primaryColor} />
            <Path d="M50 58 L50 85" stroke={secondaryColor} strokeWidth="3" />
            <Circle cx="50" cy="68" r="6" fill={secondaryColor} />
            <Circle cx="50" cy="68" r="3" fill={backgroundColor} />
            <Path d="M38 65 L42 68 L38 71" stroke={secondaryColor} strokeWidth="1.5" fill="none" />
            <Path d="M62 65 L58 68 L62 71" stroke={secondaryColor} strokeWidth="1.5" fill="none" />
            <Circle cx="44" cy="80" r="2" fill={secondaryColor} opacity={0.6} />
            <Circle cx="56" cy="80" r="2" fill={secondaryColor} opacity={0.6} />
          </G>
        );

      case 'slime_cute':
        return (
          <G>
            <Ellipse cx="50" cy="55" rx="35" ry="35" fill={primaryColor} opacity={0.8} />
            <Ellipse cx="50" cy="50" rx="30" ry="30" fill={primaryColor} />
            <Ellipse cx="50" cy="45" rx="25" ry="22" fill={backgroundColor} opacity={0.4} />
            <Ellipse cx="40" cy="45" rx="8" ry="10" fill={backgroundColor} />
            <Ellipse cx="60" cy="45" rx="8" ry="10" fill={backgroundColor} />
            <Ellipse cx="40" cy="44" rx="5" ry="6" fill="#1f2937" />
            <Ellipse cx="60" cy="44" rx="5" ry="6" fill="#1f2937" />
            <Ellipse cx="38" cy="42" rx="2" ry="2.5" fill="#ffffff" />
            <Ellipse cx="58" cy="42" rx="2" ry="2.5" fill="#ffffff" />
            <Ellipse cx="42" cy="55" rx="4" ry="2" fill="#fca5a5" opacity={0.6} />
            <Ellipse cx="58" cy="55" rx="4" ry="2" fill="#fca5a5" opacity={0.6} />
            <Path d="M45 60 Q50 65 55 60" stroke={primaryColor} strokeWidth="2" fill="none" />
            <Ellipse cx="30" cy="75" rx="8" ry="5" fill={primaryColor} opacity={0.5} />
            <Ellipse cx="70" cy="75" rx="8" ry="5" fill={primaryColor} opacity={0.5} />
            <Circle cx="35" cy="30" r="4" fill={secondaryColor} opacity={0.4} />
            <Circle cx="55" cy="25" r="3" fill={secondaryColor} opacity={0.3} />
          </G>
        );

      case 'golem_stone':
        return (
          <G>
            <Polygon points="50,8 65,20 62,35 38,35 35,20" fill={primaryColor} />
            <Polygon points="40,12 50,8 60,12 58,22 42,22" fill={secondaryColor} />
            <Rect x="30" y="30" width="40" height="35" rx="5" fill={primaryColor} />
            <Rect x="34" y="34" width="32" height="26" rx="3" fill={backgroundColor} />
            <Rect x="38" y="38" width="10" height="8" rx="2" fill={primaryColor} />
            <Rect x="52" y="38" width="10" height="8" rx="2" fill={primaryColor} />
            <Circle cx="43" cy="42" r="3" fill={secondaryColor} />
            <Circle cx="57" cy="42" r="3" fill={secondaryColor} />
            <Circle cx="43" cy="41" r="1" fill="#ffffff" />
            <Circle cx="57" cy="41" r="1" fill="#ffffff" />
            <Rect x="42" y="52" width="16" height="4" rx="1" fill={primaryColor} />
            <Path d="M44 54 L56 54" stroke={secondaryColor} strokeWidth="1.5" />
            <Rect x="18" y="35" width="12" height="28" rx="3" fill={primaryColor} />
            <Rect x="70" y="35" width="12" height="28" rx="3" fill={primaryColor} />
            <Rect x="20" y="40" width="8" height="6" rx="2" fill={secondaryColor} />
            <Rect x="72" y="40" width="8" height="6" rx="2" fill={secondaryColor} />
            <Rect x="28" y="65" width="44" height="30" rx="5" fill={primaryColor} />
            <Polygon points="50,68 60,72 60,85 50,90 40,85 40,72" fill={secondaryColor} />
            <Circle cx="50" cy="80" r="4" fill={backgroundColor} />
          </G>
        );

      case 'spirit_flame':
        return (
          <G>
            <Path d="M50 5 Q60 15 55 25 Q65 20 60 35 Q70 30 62 45 L50 50 L38 45 Q30 30 40 35 Q35 20 45 25 Q40 15 50 5" fill={secondaryColor} opacity={0.8} />
            <Path d="M50 10 Q58 18 54 28 Q62 24 58 38 L50 45 L42 38 Q38 24 46 28 Q42 18 50 10" fill={primaryColor} />
            <Ellipse cx="50" cy="55" rx="20" ry="18" fill={primaryColor} />
            <Circle cx="50" cy="52" r="14" fill={backgroundColor} opacity={0.6} />
            <Ellipse cx="44" cy="50" rx="4" ry="5" fill={secondaryColor} />
            <Ellipse cx="56" cy="50" rx="4" ry="5" fill={secondaryColor} />
            <Circle cx="44" cy="49" r="2" fill="#ffffff" />
            <Circle cx="56" cy="49" r="2" fill="#ffffff" />
            <Path d="M46 60 Q50 63 54 60" stroke={secondaryColor} strokeWidth="1.5" fill="none" />
            <Path d="M35 70 Q50 65 65 70 L62 95 Q50 105 38 95 Z" fill={primaryColor} opacity={0.9} />
            <Path d="M38 75 Q50 70 62 75" stroke={secondaryColor} strokeWidth="2" fill="none" />
            <Path d="M40 82 Q50 78 60 82" stroke={secondaryColor} strokeWidth="1.5" fill="none" opacity={0.7} />
            <Circle cx="50" cy="80" r="5" fill={secondaryColor} opacity={0.6} />
            <Circle cx="50" cy="80" r="2" fill="#ffffff" />
          </G>
        );

      case 'spirit_ice':
        return (
          <G>
            <Polygon points="50,5 58,15 55,25 60,30 50,35 40,30 45,25 42,15" fill={secondaryColor} opacity={0.6} />
            <Polygon points="50,8 55,16 52,23 56,28 50,32 44,28 48,23 45,16" fill="#ffffff" opacity={0.4} />
            <Polygon points="35,25 42,35 38,45 50,50 62,45 58,35 65,25 50,20" fill={primaryColor} />
            <Circle cx="50" cy="45" r="16" fill={backgroundColor} />
            <Polygon points="44,40 48,36 52,40 48,44" fill={primaryColor} />
            <Polygon points="52,40 56,36 60,40 56,44" fill={primaryColor} />
            <Circle cx="46" cy="40" r="2" fill={secondaryColor} />
            <Circle cx="58" cy="40" r="2" fill={secondaryColor} />
            <Circle cx="46" cy="39" r="0.8" fill="#ffffff" />
            <Circle cx="58" cy="39" r="0.8" fill="#ffffff" />
            <Path d="M47 52 Q50 54 53 52" stroke={primaryColor} strokeWidth="1.5" fill="none" />
            <Polygon points="50,58 68,68 65,95 50,100 35,95 32,68" fill={primaryColor} />
            <Polygon points="50,62 60,70 58,88 50,92 42,88 40,70" fill={secondaryColor} opacity={0.3} />
            <Circle cx="50" cy="78" r="5" fill={secondaryColor} />
            <Circle cx="50" cy="78" r="2" fill="#ffffff" />
          </G>
        );

      case 'assassin':
        return (
          <G>
            <Path d="M30 35 Q50 5 70 35 L68 45 Q50 40 32 45 Z" fill={primaryColor} />
            <Path d="M35 32 Q50 10 65 32 L63 40 Q50 36 37 40 Z" fill={backgroundColor} opacity={0.3} />
            <Ellipse cx="50" cy="42" rx="18" ry="16" fill={primaryColor} />
            <Path d="M35 35 Q50 32 65 35 L65 50 Q50 48 35 50 Z" fill={secondaryColor} />
            <Ellipse cx="42" cy="40" rx="5" ry="4" fill={backgroundColor} />
            <Ellipse cx="58" cy="40" rx="5" ry="4" fill={backgroundColor} />
            <Ellipse cx="42" cy="40" rx="2.5" ry="2" fill={primaryColor} />
            <Ellipse cx="58" cy="40" rx="2.5" ry="2" fill={primaryColor} />
            <Circle cx="42" cy="39" r="1" fill="#ffffff" />
            <Circle cx="58" cy="39" r="1" fill="#ffffff" />
            <Path d="M32 55 Q50 48 68 55 L70 92 Q50 100 30 92 Z" fill={primaryColor} />
            <Path d="M35 58 L50 52 L65 58" stroke={secondaryColor} strokeWidth="2" fill="none" />
            <Path d="M38 68 L50 62 L62 68" stroke={secondaryColor} strokeWidth="1.5" fill="none" opacity={0.7} />
            <Ellipse cx="50" cy="72" rx="8" ry="6" fill={secondaryColor} opacity={0.5} />
            <Path d="M45 70 L50 75 L55 70" stroke={secondaryColor} strokeWidth="1.5" fill="none" />
            <Path d="M22 60 L32 55 L35 75 L25 80 Z" fill={primaryColor} opacity={0.8} />
            <Path d="M78 60 L68 55 L65 75 L75 80 Z" fill={primaryColor} opacity={0.8} />
          </G>
        );

      case 'paladin':
        return (
          <G>
            <Path d="M25 45 L35 30 L40 45 L35 55 L25 55 Z" fill={secondaryColor} opacity={0.8} />
            <Path d="M75 45 L65 30 L60 45 L65 55 L75 55 Z" fill={secondaryColor} opacity={0.8} />
            <Ellipse cx="50" cy="30" rx="16" ry="18" fill={primaryColor} />
            <Circle cx="50" cy="28" r="13" fill={backgroundColor} />
            <Rect x="35" y="12" width="30" height="8" rx="2" fill={secondaryColor} />
            <Circle cx="50" cy="8" r="4" fill={secondaryColor} />
            <Ellipse cx="44" cy="26" rx="4" ry="5" fill={primaryColor} />
            <Ellipse cx="56" cy="26" rx="4" ry="5" fill={primaryColor} />
            <Circle cx="44" cy="25" r="2" fill="#ffffff" />
            <Circle cx="56" cy="25" r="2" fill="#ffffff" />
            <Path d="M46 36 Q50 38 54 36" stroke={primaryColor} strokeWidth="1.5" fill="none" />
            <Path d="M32 48 L38 42 L50 46 L62 42 L68 48 L70 92 Q50 100 30 92 Z" fill={primaryColor} />
            <Rect x="42" y="50" width="16" height="20" rx="2" fill={secondaryColor} />
            <Path d="M50 52 L50 68" stroke={backgroundColor} strokeWidth="3" />
            <Path d="M44 58 L56 58" stroke={backgroundColor} strokeWidth="3" />
            <Circle cx="50" cy="60" r="3" fill={backgroundColor} />
            <Rect x="40" y="74" width="20" height="4" rx="1" fill={secondaryColor} />
            <Rect x="42" y="82" width="16" height="3" rx="1" fill={secondaryColor} opacity={0.7} />
          </G>
        );

      case 'animal_dolphin':
        return (
          <G>
            <Ellipse cx="50" cy="45" rx="28" ry="22" fill={primaryColor} />
            <Path d="M22 45 Q15 35 25 30 Q20 40 25 45" fill={primaryColor} />
            <Path d="M78 45 Q85 40 82 50 L78 48" fill={primaryColor} />
            <Path d="M50 25 Q55 15 60 20 Q55 25 55 30" fill={secondaryColor} />
            <Ellipse cx="50" cy="42" rx="22" ry="16" fill={backgroundColor} opacity={0.4} />
            <Circle cx="35" cy="40" r="5" fill={backgroundColor} />
            <Circle cx="35" cy="39" r="2.5" fill="#1f2937" />
            <Circle cx="34" cy="38" r="1" fill="#ffffff" />
            <Path d="M45 52 Q50 56 55 52" stroke={secondaryColor} strokeWidth="2" fill="none" />
            <Ellipse cx="50" cy="72" rx="15" ry="18" fill={primaryColor} />
            <Path d="M35 85 Q30 95 25 90 Q35 88 38 82" fill={secondaryColor} />
            <Path d="M65 85 Q70 95 75 90 Q65 88 62 82" fill={secondaryColor} />
            <Ellipse cx="50" cy="70" rx="10" ry="12" fill={backgroundColor} opacity={0.3} />
          </G>
        );

      case 'animal_seahorse':
        return (
          <G>
            <Path d="M50 10 Q60 15 55 25 Q50 20 50 10" fill={secondaryColor} />
            <Ellipse cx="50" cy="32" rx="14" ry="16" fill={primaryColor} />
            <Circle cx="50" cy="30" r="11" fill={backgroundColor} />
            <Circle cx="45" cy="28" r="4" fill={primaryColor} />
            <Circle cx="45" cy="27" r="2" fill="#1f2937" />
            <Circle cx="44" cy="26" r="0.8" fill="#ffffff" />
            <Path d="M52 35 Q55 38 52 40" fill={primaryColor} />
            <Ellipse cx="50" cy="55" rx="12" ry="18" fill={primaryColor} />
            <Path d="M38 55 Q32 50 35 45 Q40 50 40 55" fill={secondaryColor} opacity={0.6} />
            <Path d="M50 73 Q55 80 50 90 Q45 85 48 78 Q42 85 45 92" fill={primaryColor} />
            <Ellipse cx="50" cy="58" rx="8" ry="12" fill={backgroundColor} opacity={0.3} />
            <Path d="M42 50 L42 65" stroke={secondaryColor} strokeWidth="1.5" opacity={0.5} />
            <Path d="M50 48 L50 68" stroke={secondaryColor} strokeWidth="1.5" opacity={0.5} />
            <Path d="M58 50 L58 65" stroke={secondaryColor} strokeWidth="1.5" opacity={0.5} />
          </G>
        );

      case 'animal_turtle':
        return (
          <G>
            <Ellipse cx="50" cy="55" rx="30" ry="25" fill={primaryColor} />
            <Ellipse cx="50" cy="52" rx="26" ry="20" fill={secondaryColor} />
            <Path d="M30 45 L40 35 L50 45 L60 35 L70 45 L65 55 L50 60 L35 55 Z" fill={primaryColor} opacity={0.8} />
            <Polygon points="50,38 58,45 58,55 50,60 42,55 42,45" fill={secondaryColor} opacity={0.6} />
            <Ellipse cx="35" cy="35" rx="10" ry="12" fill={primaryColor} />
            <Circle cx="35" cy="32" r="8" fill={backgroundColor} />
            <Circle cx="32" cy="30" r="3" fill={primaryColor} />
            <Circle cx="38" cy="30" r="3" fill={primaryColor} />
            <Circle cx="32" cy="29" r="1.5" fill="#1f2937" />
            <Circle cx="38" cy="29" r="1.5" fill="#1f2937" />
            <Path d="M33 38 Q35 40 37 38" stroke={primaryColor} strokeWidth="1" fill="none" />
            <Ellipse cx="22" cy="60" rx="8" ry="6" fill={primaryColor} />
            <Ellipse cx="78" cy="60" rx="8" ry="6" fill={primaryColor} />
            <Ellipse cx="35" cy="78" rx="7" ry="5" fill={primaryColor} />
            <Ellipse cx="65" cy="78" rx="7" ry="5" fill={primaryColor} />
            <Ellipse cx="50" cy="82" rx="5" ry="4" fill={primaryColor} />
          </G>
        );

      case 'animal_fox':
        return (
          <G>
            <Path d="M25 35 L35 8 L42 30" fill={primaryColor} />
            <Path d="M75 35 L65 8 L58 30" fill={primaryColor} />
            <Path d="M28 30 L36 12 L40 28" fill={secondaryColor} opacity={0.6} />
            <Path d="M72 30 L64 12 L60 28" fill={secondaryColor} opacity={0.6} />
            <Ellipse cx="50" cy="42" rx="22" ry="20" fill={primaryColor} />
            <Ellipse cx="50" cy="48" rx="12" ry="10" fill={backgroundColor} />
            <Ellipse cx="40" cy="38" rx="6" ry="7" fill={backgroundColor} />
            <Ellipse cx="60" cy="38" rx="6" ry="7" fill={backgroundColor} />
            <Ellipse cx="40" cy="37" rx="3" ry="4" fill="#1f2937" />
            <Ellipse cx="60" cy="37" rx="3" ry="4" fill="#1f2937" />
            <Circle cx="39" cy="36" r="1" fill="#ffffff" />
            <Circle cx="59" cy="36" r="1" fill="#ffffff" />
            <Ellipse cx="50" cy="50" rx="5" ry="3" fill="#1f2937" />
            <Path d="M45 54 L50 58 L55 54" stroke={primaryColor} strokeWidth="1.5" fill="none" />
            <Ellipse cx="50" cy="75" rx="18" ry="20" fill={primaryColor} />
            <Ellipse cx="50" cy="72" rx="12" ry="14" fill={backgroundColor} />
            <Path d="M40 68 L50 62 L60 68" stroke={secondaryColor} strokeWidth="2" fill="none" />
          </G>
        );

      case 'animal_lion':
        return (
          <G>
            <Circle cx="50" cy="45" r="35" fill={secondaryColor} />
            <Circle cx="50" cy="45" r="28" fill={primaryColor} />
            <Ellipse cx="50" cy="48" rx="20" ry="18" fill={primaryColor} />
            <Circle cx="50" cy="45" r="16" fill={backgroundColor} />
            <Path d="M25 30 Q30 20 40 25" stroke={secondaryColor} strokeWidth="4" fill="none" />
            <Path d="M75 30 Q70 20 60 25" stroke={secondaryColor} strokeWidth="4" fill="none" />
            <Ellipse cx="42" cy="42" rx="5" ry="6" fill={primaryColor} />
            <Ellipse cx="58" cy="42" rx="5" ry="6" fill={primaryColor} />
            <Ellipse cx="42" cy="41" rx="2.5" ry="3" fill="#92400e" />
            <Ellipse cx="58" cy="41" rx="2.5" ry="3" fill="#92400e" />
            <Circle cx="41" cy="40" r="1" fill="#ffffff" />
            <Circle cx="57" cy="40" r="1" fill="#ffffff" />
            <Ellipse cx="50" cy="52" rx="6" ry="4" fill={primaryColor} />
            <Ellipse cx="50" cy="54" rx="3" ry="2" fill="#1f2937" />
            <Path d="M44 58 L50 62 L56 58" stroke={primaryColor} strokeWidth="2" fill="none" />
            <Path d="M42 60 L44 58 M56 58 L58 60" stroke={primaryColor} strokeWidth="1.5" />
            <Ellipse cx="50" cy="80" rx="14" ry="12" fill={primaryColor} />
          </G>
        );

      case 'animal_tiger':
        return (
          <G>
            <Path d="M28 30 L35 10 L42 28" fill={primaryColor} />
            <Path d="M72 30 L65 10 L58 28" fill={primaryColor} />
            <Ellipse cx="50" cy="42" rx="24" ry="22" fill={primaryColor} />
            <Circle cx="50" cy="40" r="17" fill={backgroundColor} />
            <Path d="M30 35 L38 38" stroke="#1f2937" strokeWidth="3" />
            <Path d="M32 42 L40 43" stroke="#1f2937" strokeWidth="2" />
            <Path d="M70 35 L62 38" stroke="#1f2937" strokeWidth="3" />
            <Path d="M68 42 L60 43" stroke="#1f2937" strokeWidth="2" />
            <Ellipse cx="42" cy="38" rx="5" ry="6" fill={primaryColor} />
            <Ellipse cx="58" cy="38" rx="5" ry="6" fill={primaryColor} />
            <Ellipse cx="42" cy="37" rx="2.5" ry="3" fill="#fbbf24" />
            <Ellipse cx="58" cy="37" rx="2.5" ry="3" fill="#fbbf24" />
            <Circle cx="42" cy="36" r="1.5" fill="#1f2937" />
            <Circle cx="58" cy="36" r="1.5" fill="#1f2937" />
            <Ellipse cx="50" cy="48" rx="5" ry="3" fill={primaryColor} />
            <Ellipse cx="50" cy="50" rx="3" ry="2" fill="#fca5a5" />
            <Path d="M44 54 L50 58 L56 54" stroke={primaryColor} strokeWidth="2" fill="none" />
            <Ellipse cx="50" cy="78" rx="16" ry="18" fill={primaryColor} />
            <Path d="M40 72 L50 68 L60 72" stroke="#1f2937" strokeWidth="2" fill="none" />
            <Path d="M42 80 L50 76 L58 80" stroke="#1f2937" strokeWidth="2" fill="none" />
          </G>
        );

      case 'animal_bear':
        return (
          <G>
            <Circle cx="30" cy="22" r="12" fill={primaryColor} />
            <Circle cx="70" cy="22" r="12" fill={primaryColor} />
            <Circle cx="30" cy="22" r="7" fill={secondaryColor} />
            <Circle cx="70" cy="22" r="7" fill={secondaryColor} />
            <Ellipse cx="50" cy="42" rx="26" ry="24" fill={primaryColor} />
            <Circle cx="50" cy="40" r="18" fill={backgroundColor} />
            <Ellipse cx="42" cy="38" rx="5" ry="6" fill={primaryColor} />
            <Ellipse cx="58" cy="38" rx="5" ry="6" fill={primaryColor} />
            <Circle cx="42" cy="37" r="2.5" fill="#1f2937" />
            <Circle cx="58" cy="37" r="2.5" fill="#1f2937" />
            <Circle cx="41" cy="36" r="1" fill="#ffffff" />
            <Circle cx="57" cy="36" r="1" fill="#ffffff" />
            <Ellipse cx="50" cy="48" rx="8" ry="6" fill={secondaryColor} />
            <Ellipse cx="50" cy="50" rx="4" ry="3" fill="#1f2937" />
            <Path d="M46 54 Q50 58 54 54" stroke={primaryColor} strokeWidth="1.5" fill="none" />
            <Ellipse cx="50" cy="78" rx="20" ry="18" fill={primaryColor} />
            <Ellipse cx="50" cy="76" rx="14" ry="12" fill={secondaryColor} opacity={0.4} />
          </G>
        );

      case 'animal_butterfly':
        return (
          <G>
            <Path d="M20 35 Q10 25 15 15 Q25 20 30 35 Q25 45 20 35" fill={primaryColor} />
            <Path d="M80 35 Q90 25 85 15 Q75 20 70 35 Q75 45 80 35" fill={primaryColor} />
            <Path d="M25 32 Q18 25 22 18 Q28 22 32 32" fill={secondaryColor} opacity={0.6} />
            <Path d="M75 32 Q82 25 78 18 Q72 22 68 32" fill={secondaryColor} opacity={0.6} />
            <Circle cx="25" cy="28" r="4" fill={backgroundColor} opacity={0.5} />
            <Circle cx="75" cy="28" r="4" fill={backgroundColor} opacity={0.5} />
            <Path d="M25 55 Q15 65 20 80 Q30 70 35 55 Q30 50 25 55" fill={primaryColor} />
            <Path d="M75 55 Q85 65 80 80 Q70 70 65 55 Q70 50 75 55" fill={primaryColor} />
            <Path d="M28 60 Q22 68 25 75 Q32 68 35 58" fill={secondaryColor} opacity={0.6} />
            <Path d="M72 60 Q78 68 75 75 Q68 68 65 58" fill={secondaryColor} opacity={0.6} />
            <Ellipse cx="50" cy="50" rx="8" ry="35" fill={secondaryColor} />
            <Ellipse cx="50" cy="50" rx="5" ry="30" fill={primaryColor} />
            <Circle cx="50" cy="18" r="6" fill={primaryColor} />
            <Circle cx="50" cy="18" r="4" fill={backgroundColor} />
            <Circle cx="48" cy="17" r="1.5" fill="#1f2937" />
            <Circle cx="52" cy="17" r="1.5" fill="#1f2937" />
            <Path d="M45 8 Q48 5 50 10" stroke={secondaryColor} strokeWidth="1.5" fill="none" />
            <Path d="M55 8 Q52 5 50 10" stroke={secondaryColor} strokeWidth="1.5" fill="none" />
          </G>
        );

      case 'animal_dragonfly':
        return (
          <G>
            <Ellipse cx="50" cy="25" rx="14" ry="12" fill={primaryColor} />
            <Circle cx="50" cy="24" r="10" fill={backgroundColor} />
            <Circle cx="45" cy="22" r="5" fill={primaryColor} />
            <Circle cx="55" cy="22" r="5" fill={primaryColor} />
            <Circle cx="45" cy="21" r="3" fill="#06b6d4" />
            <Circle cx="55" cy="21" r="3" fill="#06b6d4" />
            <Circle cx="44" cy="20" r="1" fill="#ffffff" />
            <Circle cx="54" cy="20" r="1" fill="#ffffff" />
            <Path d="M15 30 Q30 20 45 30 Q30 35 20 32" fill={primaryColor} opacity={0.7} />
            <Path d="M85 30 Q70 20 55 30 Q70 35 80 32" fill={primaryColor} opacity={0.7} />
            <Path d="M20 28 Q32 22 42 28" stroke={secondaryColor} strokeWidth="1" fill="none" />
            <Path d="M80 28 Q68 22 58 28" stroke={secondaryColor} strokeWidth="1" fill="none" />
            <Path d="M18 45 Q32 38 48 45 Q32 50 22 48" fill={primaryColor} opacity={0.6} />
            <Path d="M82 45 Q68 38 52 45 Q68 50 78 48" fill={primaryColor} opacity={0.6} />
            <Ellipse cx="50" cy="55" rx="6" ry="20" fill={secondaryColor} />
            <Ellipse cx="50" cy="55" rx="4" ry="18" fill={primaryColor} />
            <Ellipse cx="50" cy="80" rx="4" ry="12" fill={secondaryColor} />
            <Ellipse cx="50" cy="80" rx="2.5" ry="10" fill={primaryColor} />
            <Path d="M46 45 L46 70" stroke={secondaryColor} strokeWidth="1" opacity={0.5} />
            <Path d="M54 45 L54 70" stroke={secondaryColor} strokeWidth="1" opacity={0.5} />
          </G>
        );

      case 'animal_bull':
        return (
          <G>
            <Path d="M15 35 Q10 25 20 20 L30 30" fill={primaryColor} />
            <Path d="M85 35 Q90 25 80 20 L70 30" fill={primaryColor} />
            <Path d="M18 32 Q15 26 22 23" stroke={secondaryColor} strokeWidth="3" fill="none" />
            <Path d="M82 32 Q85 26 78 23" stroke={secondaryColor} strokeWidth="3" fill="none" />
            <Ellipse cx="50" cy="45" rx="28" ry="24" fill={primaryColor} />
            <Circle cx="50" cy="42" r="18" fill={backgroundColor} />
            <Ellipse cx="40" cy="38" rx="5" ry="6" fill={primaryColor} />
            <Ellipse cx="60" cy="38" rx="5" ry="6" fill={primaryColor} />
            <Ellipse cx="40" cy="37" rx="2.5" ry="3" fill="#1f2937" />
            <Ellipse cx="60" cy="37" rx="2.5" ry="3" fill="#1f2937" />
            <Circle cx="39" cy="36" r="1" fill="#ffffff" />
            <Circle cx="59" cy="36" r="1" fill="#ffffff" />
            <Ellipse cx="50" cy="52" rx="10" ry="7" fill={secondaryColor} />
            <Circle cx="45" cy="52" r="2" fill="#1f2937" />
            <Circle cx="55" cy="52" r="2" fill="#1f2937" />
            <Ellipse cx="50" cy="78" rx="18" ry="16" fill={primaryColor} />
            <Path d="M40 72 L50 68 L60 72" stroke={secondaryColor} strokeWidth="2" fill="none" />
            <Ellipse cx="50" cy="75" rx="12" ry="10" fill={secondaryColor} opacity={0.3} />
          </G>
        );

      case 'animal_shark':
        return (
          <G>
            <Path d="M50 15 Q58 8 55 20 L50 25" fill={secondaryColor} />
            <Ellipse cx="50" cy="45" rx="32" ry="22" fill={primaryColor} />
            <Path d="M18 45 Q10 40 15 50 L22 48" fill={primaryColor} />
            <Path d="M82 45 Q90 42 88 52 L80 48" fill={primaryColor} />
            <Ellipse cx="50" cy="50" rx="25" ry="15" fill={backgroundColor} opacity={0.4} />
            <Circle cx="35" cy="40" r="5" fill={backgroundColor} />
            <Circle cx="35" cy="39" r="2.5" fill="#1f2937" />
            <Circle cx="34" cy="38" r="1" fill="#ffffff" />
            <Path d="M55 52 Q60 50 65 52 Q60 58 55 55" fill={backgroundColor} />
            <Path d="M42 58 L45 55 L48 58 L51 55 L54 58 L57 55 L60 58" stroke={backgroundColor} strokeWidth="2" fill="none" />
            <Ellipse cx="50" cy="75" rx="15" ry="18" fill={primaryColor} />
            <Path d="M35 88 Q30 95 25 92 Q32 90 36 85" fill={secondaryColor} />
            <Path d="M65 88 Q70 95 75 92 Q68 90 64 85" fill={secondaryColor} />
          </G>
        );

      case 'animal_tarantula':
        return (
          <G>
            <Ellipse cx="50" cy="55" rx="22" ry="18" fill={primaryColor} />
            <Ellipse cx="50" cy="30" rx="14" ry="12" fill={primaryColor} />
            <Circle cx="44" cy="28" r="4" fill="#1f2937" />
            <Circle cx="56" cy="28" r="4" fill="#1f2937" />
            <Circle cx="44" cy="27" r="2" fill="#dc2626" />
            <Circle cx="56" cy="27" r="2" fill="#dc2626" />
            <Circle cx="40" cy="32" r="2" fill="#1f2937" />
            <Circle cx="60" cy="32" r="2" fill="#1f2937" />
            <Path d="M42 38 Q44 35 46 38" fill={secondaryColor} />
            <Path d="M54 38 Q56 35 58 38" fill={secondaryColor} />
            <Path d="M20 35 Q15 25 25 30 L32 40" stroke={primaryColor} strokeWidth="4" fill="none" />
            <Path d="M80 35 Q85 25 75 30 L68 40" stroke={primaryColor} strokeWidth="4" fill="none" />
            <Path d="M15 50 Q8 42 18 45 L30 52" stroke={primaryColor} strokeWidth="4" fill="none" />
            <Path d="M85 50 Q92 42 82 45 L70 52" stroke={primaryColor} strokeWidth="4" fill="none" />
            <Path d="M18 65 Q10 60 20 58 L32 62" stroke={primaryColor} strokeWidth="4" fill="none" />
            <Path d="M82 65 Q90 60 80 58 L68 62" stroke={primaryColor} strokeWidth="4" fill="none" />
            <Path d="M25 78 Q18 75 25 70 L35 72" stroke={primaryColor} strokeWidth="4" fill="none" />
            <Path d="M75 78 Q82 75 75 70 L65 72" stroke={primaryColor} strokeWidth="4" fill="none" />
            <Ellipse cx="50" cy="55" rx="15" ry="12" fill={secondaryColor} opacity={0.4} />
          </G>
        );

      case 'animal_phoenix':
        return (
          <G>
            <Path d="M50 5 Q55 -5 60 10 Q55 15 50 12 Q45 15 40 10 Q45 -5 50 5" fill={secondaryColor} />
            <Path d="M40 12 Q35 5 45 10" fill={primaryColor} />
            <Path d="M60 12 Q65 5 55 10" fill={primaryColor} />
            <Ellipse cx="50" cy="35" rx="18" ry="16" fill={primaryColor} />
            <Circle cx="50" cy="33" r="12" fill={backgroundColor} />
            <Ellipse cx="44" cy="31" rx="4" ry="5" fill={primaryColor} />
            <Ellipse cx="56" cy="31" rx="4" ry="5" fill={primaryColor} />
            <Circle cx="44" cy="30" r="2" fill="#f59e0b" />
            <Circle cx="56" cy="30" r="2" fill="#f59e0b" />
            <Circle cx="43" cy="29" r="0.8" fill="#ffffff" />
            <Circle cx="55" cy="29" r="0.8" fill="#ffffff" />
            <Path d="M48 40 L50 42 L52 40" stroke={primaryColor} strokeWidth="1.5" fill="none" />
            <Path d="M20 40 Q30 30 40 40 Q30 50 25 55" fill={secondaryColor} opacity={0.8} />
            <Path d="M80 40 Q70 30 60 40 Q70 50 75 55" fill={secondaryColor} opacity={0.8} />
            <Path d="M25 38 Q32 32 38 38" stroke={primaryColor} strokeWidth="2" fill="none" />
            <Path d="M75 38 Q68 32 62 38" stroke={primaryColor} strokeWidth="2" fill="none" />
            <Ellipse cx="50" cy="65" rx="15" ry="20" fill={primaryColor} />
            <Path d="M35 80 Q25 95 30 100 Q40 90 42 82" fill={secondaryColor} />
            <Path d="M65 80 Q75 95 70 100 Q60 90 58 82" fill={secondaryColor} />
            <Path d="M50 85 Q48 98 52 100 Q54 95 50 85" fill={secondaryColor} />
            <Ellipse cx="50" cy="62" rx="10" ry="14" fill={secondaryColor} opacity={0.4} />
          </G>
        );

      case 'animal_snake':
        return (
          <G>
            <Ellipse cx="50" cy="30" rx="16" ry="14" fill={primaryColor} />
            <Circle cx="50" cy="28" r="11" fill={backgroundColor} />
            <Ellipse cx="44" cy="26" rx="4" ry="5" fill={primaryColor} />
            <Ellipse cx="56" cy="26" rx="4" ry="5" fill={primaryColor} />
            <Ellipse cx="44" cy="25" rx="2" ry="2.5" fill="#fbbf24" />
            <Ellipse cx="56" cy="25" rx="2" ry="2.5" fill="#fbbf24" />
            <Circle cx="44" cy="24" r="1" fill="#1f2937" />
            <Circle cx="56" cy="24" r="1" fill="#1f2937" />
            <Path d="M48 35 L50 40 L52 35" stroke="#dc2626" strokeWidth="2" fill="none" />
            <Path d="M50 44 Q30 50 25 70 Q22 85 35 90 Q45 85 50 70" fill={primaryColor} />
            <Path d="M50 44 Q70 50 75 70 Q78 85 65 90 Q55 85 50 70" fill={primaryColor} />
            <Path d="M50 70 Q50 80 50 95" stroke={primaryColor} strokeWidth="12" fill="none" />
            <Ellipse cx="50" cy="60" rx="8" ry="12" fill={secondaryColor} opacity={0.4} />
            <Path d="M30 65 Q35 60 40 65" stroke={secondaryColor} strokeWidth="2" fill="none" />
            <Path d="M60 65 Q65 60 70 65" stroke={secondaryColor} strokeWidth="2" fill="none" />
            <Path d="M35 75 Q40 70 45 75" stroke={secondaryColor} strokeWidth="2" fill="none" opacity={0.7} />
            <Path d="M55 75 Q60 70 65 75" stroke={secondaryColor} strokeWidth="2" fill="none" opacity={0.7} />
          </G>
        );

      case 'cyber':
        return (
          <G>
            <Ellipse cx="50" cy="35" rx="22" ry="25" fill={primaryColor} opacity={0.9} />
            <Circle cx="50" cy="32" r="18" fill={backgroundColor} />
            <Path d="M32 32 L42 28 L42 36 Z" fill={secondaryColor} />
            <Path d="M68 32 L58 28 L58 36 Z" fill={secondaryColor} />
            <Ellipse cx="43" cy="30" rx="4" ry="5" fill={primaryColor} />
            <Ellipse cx="57" cy="30" rx="4" ry="5" fill={primaryColor} />
            <Circle cx="43" cy="30" r="2" fill="#ffffff" />
            <Circle cx="57" cy="30" r="2" fill="#ffffff" />
            <Path d="M45 40 Q50 44 55 40" stroke={primaryColor} strokeWidth="2" fill="none" />
            <Path d="M28 20 L35 25 L28 30" stroke={secondaryColor} strokeWidth="2" fill="none" />
            <Path d="M72 20 L65 25 L72 30" stroke={secondaryColor} strokeWidth="2" fill="none" />
            <Path d="M35 55 Q50 48 65 55 L68 85 Q50 95 32 85 Z" fill={primaryColor} />
            <Path d="M40 58 L40 75" stroke={secondaryColor} strokeWidth="2" />
            <Path d="M50 55 L50 78" stroke={secondaryColor} strokeWidth="2" />
            <Path d="M60 58 L60 75" stroke={secondaryColor} strokeWidth="2" />
            <Circle cx="50" cy="62" r="5" fill={secondaryColor} />
            <Rect x="45" y="70" width="10" height="3" rx="1" fill={secondaryColor} />
          </G>
        );

      case 'guardian':
        return (
          <G>
            <Path d="M50 12 L70 25 L70 45 L50 58 L30 45 L30 25 Z" fill={primaryColor} />
            <Circle cx="50" cy="35" r="16" fill={backgroundColor} />
            <Path d="M50 22 L58 28 L58 42 L50 48 L42 42 L42 28 Z" fill={primaryColor} opacity={0.3} />
            <Ellipse cx="44" cy="33" rx="4" ry="5" fill={primaryColor} />
            <Ellipse cx="56" cy="33" rx="4" ry="5" fill={primaryColor} />
            <Circle cx="44" cy="33" r="2" fill="#ffffff" />
            <Circle cx="56" cy="33" r="2" fill="#ffffff" />
            <Path d="M46 42 Q50 45 54 42" stroke={primaryColor} strokeWidth="1.5" fill="none" />
            <Path d="M30 55 L35 50 L50 55 L65 50 L70 55 L70 88 L50 95 L30 88 Z" fill={primaryColor} />
            <Path d="M50 55 L50 85" stroke={secondaryColor} strokeWidth="3" />
            <Circle cx="50" cy="65" r="6" fill={secondaryColor} />
            <Path d="M38 60 L38 80" stroke={secondaryColor} strokeWidth="2" opacity={0.6} />
            <Path d="M62 60 L62 80" stroke={secondaryColor} strokeWidth="2" opacity={0.6} />
            <Polygon points="50,58 55,63 55,70 50,75 45,70 45,63" fill={backgroundColor} />
          </G>
        );

      case 'sage':
        return (
          <G>
            <Circle cx="50" cy="38" r="22" fill={primaryColor} opacity={0.8} />
            <Circle cx="50" cy="36" r="17" fill={backgroundColor} />
            <Ellipse cx="43" cy="34" rx="5" ry="6" fill={primaryColor} />
            <Ellipse cx="57" cy="34" rx="5" ry="6" fill={primaryColor} />
            <Circle cx="43" cy="33" r="2.5" fill="#ffffff" />
            <Circle cx="57" cy="33" r="2.5" fill="#ffffff" />
            <Path d="M44 44 Q50 48 56 44" stroke={primaryColor} strokeWidth="1.5" fill="none" />
            <Path d="M35 20 Q50 10 65 20" stroke={secondaryColor} strokeWidth="2" fill="none" />
            <Circle cx="50" cy="14" r="4" fill={secondaryColor} />
            <Path d="M35 58 Q50 52 65 58 Q68 75 65 90 Q50 98 35 90 Q32 75 35 58" fill={primaryColor} />
            <Path d="M42 62 Q50 58 58 62" stroke={secondaryColor} strokeWidth="1.5" fill="none" />
            <Path d="M40 70 Q50 65 60 70" stroke={secondaryColor} strokeWidth="1.5" fill="none" />
            <Path d="M38 78 Q50 73 62 78" stroke={secondaryColor} strokeWidth="1.5" fill="none" />
            <Ellipse cx="50" cy="68" rx="8" ry="6" fill={backgroundColor} opacity={0.5} />
            <Circle cx="50" cy="68" r="3" fill={secondaryColor} />
          </G>
        );

      case 'phantom':
        return (
          <G>
            <Path d="M50 15 Q72 20 70 45 Q68 55 50 60 Q32 55 30 45 Q28 20 50 15" fill={primaryColor} opacity={0.85} />
            <Ellipse cx="50" cy="38" rx="15" ry="14" fill={backgroundColor} />
            <Path d="M38 35 L45 38 L38 41" fill={primaryColor} />
            <Path d="M62 35 L55 38 L62 41" fill={primaryColor} />
            <Path d="M44 44 L50 48 L56 44" stroke={primaryColor} strokeWidth="1.5" fill="none" />
            <Path d="M28 25 L35 30" stroke={secondaryColor} strokeWidth="2" opacity={0.7} />
            <Path d="M72 25 L65 30" stroke={secondaryColor} strokeWidth="2" opacity={0.7} />
            <Path d="M35 58 L30 65 L32 90 Q50 100 68 90 L70 65 L65 58 Q50 52 35 58" fill={primaryColor} opacity={0.9} />
            <Path d="M40 62 L40 82" stroke={secondaryColor} strokeWidth="1" opacity={0.5} />
            <Path d="M50 58 L50 88" stroke={secondaryColor} strokeWidth="2" />
            <Path d="M60 62 L60 82" stroke={secondaryColor} strokeWidth="1" opacity={0.5} />
            <Ellipse cx="50" cy="70" rx="6" ry="4" fill={secondaryColor} opacity={0.8} />
            <Circle cx="50" cy="70" r="2" fill="#ffffff" />
          </G>
        );

      case 'nova':
        return (
          <G>
            <Circle cx="50" cy="35" r="20" fill={primaryColor} />
            <Circle cx="50" cy="35" r="15" fill={backgroundColor} />
            <Path d="M50 15 L53 25 L50 22 L47 25 Z" fill={secondaryColor} />
            <Path d="M70 35 L60 38 L63 35 L60 32 Z" fill={secondaryColor} />
            <Path d="M30 35 L40 32 L37 35 L40 38 Z" fill={secondaryColor} />
            <Ellipse cx="44" cy="33" rx="4" ry="5" fill={primaryColor} />
            <Ellipse cx="56" cy="33" rx="4" ry="5" fill={primaryColor} />
            <Circle cx="44" cy="32" r="2" fill="#ffffff" />
            <Circle cx="56" cy="32" r="2" fill="#ffffff" />
            <Path d="M45 42 Q50 46 55 42" stroke={primaryColor} strokeWidth="1.5" fill="none" />
            <Ellipse cx="50" cy="72" rx="18" ry="25" fill={primaryColor} />
            <Path d="M35 60 L35 85" stroke={secondaryColor} strokeWidth="2" />
            <Path d="M65 60 L65 85" stroke={secondaryColor} strokeWidth="2" />
            <Circle cx="50" cy="62" r="7" fill={secondaryColor} />
            <Circle cx="50" cy="62" r="4" fill={backgroundColor} />
            <Path d="M43 75 L57 75" stroke={secondaryColor} strokeWidth="2" />
            <Path d="M45 82 L55 82" stroke={secondaryColor} strokeWidth="2" />
          </G>
        );

      case 'sentinel':
        return (
          <G>
            <Rect x="32" y="18" width="36" height="40" rx="8" fill={primaryColor} />
            <Rect x="36" y="24" width="28" height="28" rx="4" fill={backgroundColor} />
            <Rect x="40" y="28" width="8" height="10" rx="2" fill={primaryColor} />
            <Rect x="52" y="28" width="8" height="10" rx="2" fill={primaryColor} />
            <Circle cx="44" cy="32" r="2" fill="#ffffff" />
            <Circle cx="56" cy="32" r="2" fill="#ffffff" />
            <Rect x="44" y="42" width="12" height="3" rx="1" fill={primaryColor} />
            <Path d="M26 20 L32 25 L32 35 L26 40 Z" fill={secondaryColor} />
            <Path d="M74 20 L68 25 L68 35 L74 40 Z" fill={secondaryColor} />
            <Rect x="30" y="58" width="40" height="35" rx="4" fill={primaryColor} />
            <Rect x="35" y="62" width="30" height="8" rx="2" fill={secondaryColor} />
            <Circle cx="50" cy="66" r="3" fill={backgroundColor} />
            <Rect x="38" y="75" width="24" height="3" rx="1" fill={secondaryColor} opacity={0.7} />
            <Rect x="40" y="82" width="20" height="3" rx="1" fill={secondaryColor} opacity={0.5} />
          </G>
        );

      case 'oracle':
        return (
          <G>
            <Ellipse cx="50" cy="35" rx="20" ry="22" fill={primaryColor} opacity={0.9} />
            <Circle cx="50" cy="35" r="15" fill={backgroundColor} />
            <Ellipse cx="50" cy="32" rx="12" ry="8" fill={primaryColor} opacity={0.2} />
            <Circle cx="43" cy="32" r="5" fill={primaryColor} />
            <Circle cx="57" cy="32" r="5" fill={primaryColor} />
            <Circle cx="43" cy="31" r="2.5" fill="#ffffff" />
            <Circle cx="57" cy="31" r="2.5" fill="#ffffff" />
            <Circle cx="44" cy="30" r="1" fill={secondaryColor} />
            <Circle cx="58" cy="30" r="1" fill={secondaryColor} />
            <Path d="M46 42 Q50 45 54 42" stroke={primaryColor} strokeWidth="1.5" fill="none" />
            <Circle cx="50" cy="12" r="5" fill={secondaryColor} />
            <Path d="M50 17 L50 22" stroke={secondaryColor} strokeWidth="2" />
            <Path d="M32 60 Q50 50 68 60 L65 92 Q50 100 35 92 Z" fill={primaryColor} />
            <Ellipse cx="50" cy="68" rx="10" ry="8" fill={backgroundColor} opacity={0.6} />
            <Circle cx="50" cy="68" r="5" fill={secondaryColor} />
            <Circle cx="50" cy="68" r="2" fill="#ffffff" />
            <Path d="M40 80 L60 80" stroke={secondaryColor} strokeWidth="1.5" opacity={0.6} />
            <Path d="M42 86 L58 86" stroke={secondaryColor} strokeWidth="1.5" opacity={0.4} />
          </G>
        );

      case 'nexus':
        return (
          <G>
            <Polygon points="50,12 72,30 72,50 50,60 28,50 28,30" fill={primaryColor} />
            <Polygon points="50,18 66,32 66,48 50,55 34,48 34,32" fill={backgroundColor} />
            <Polygon points="50,24 58,30 58,42 50,48 42,42 42,30" fill={primaryColor} opacity={0.2} />
            <Ellipse cx="44" cy="35" rx="4" ry="5" fill={primaryColor} />
            <Ellipse cx="56" cy="35" rx="4" ry="5" fill={primaryColor} />
            <Circle cx="44" cy="34" r="2" fill="#ffffff" />
            <Circle cx="56" cy="34" r="2" fill="#ffffff" />
            <Path d="M46 44 Q50 47 54 44" stroke={primaryColor} strokeWidth="1.5" fill="none" />
            <Polygon points="50,58 70,68 68,92 50,98 32,92 30,68" fill={primaryColor} />
            <Path d="M50 62 L50 90" stroke={secondaryColor} strokeWidth="2" />
            <Path d="M38 68 L38 85" stroke={secondaryColor} strokeWidth="1.5" opacity={0.6} />
            <Path d="M62 68 L62 85" stroke={secondaryColor} strokeWidth="1.5" opacity={0.6} />
            <Polygon points="50,65 56,70 56,78 50,83 44,78 44,70" fill={secondaryColor} />
            <Circle cx="50" cy="74" r="3" fill={backgroundColor} />
          </G>
        );

      case 'prism':
        return (
          <G>
            <Path d="M50 10 L70 25 L70 50 L50 58 L30 50 L30 25 Z" fill={primaryColor} opacity={0.85} />
            <Path d="M50 16 L64 28 L64 46 L50 52 L36 46 L36 28 Z" fill={backgroundColor} />
            <Path d="M50 22 L58 30 L58 42 L50 48 L42 42 L42 30 Z" fill={primaryColor} opacity={0.15} />
            <Circle cx="44" cy="35" r="4" fill={primaryColor} />
            <Circle cx="56" cy="35" r="4" fill={primaryColor} />
            <Circle cx="44" cy="34" r="2" fill="#ffffff" />
            <Circle cx="56" cy="34" r="2" fill="#ffffff" />
            <Path d="M46 44 Q50 47 54 44" stroke={primaryColor} strokeWidth="1.5" fill="none" />
            <Path d="M30 58 L50 52 L70 58 L68 95 L50 100 L32 95 Z" fill={primaryColor} />
            <Path d="M36 62 L50 56 L64 62" stroke={secondaryColor} strokeWidth="1.5" fill="none" />
            <Path d="M38 72 L50 66 L62 72" stroke={secondaryColor} strokeWidth="1.5" fill="none" opacity={0.7} />
            <Path d="M40 82 L50 76 L60 82" stroke={secondaryColor} strokeWidth="1.5" fill="none" opacity={0.5} />
            <Circle cx="50" cy="68" r="6" fill={secondaryColor} />
            <Circle cx="50" cy="68" r="3" fill={backgroundColor} />
          </G>
        );

      case 'classic':
      default:
        return (
          <G>
            <Ellipse cx="50" cy="36" rx="20" ry="22" fill={primaryColor} />
            <Circle cx="50" cy="35" r="16" fill={backgroundColor} />
            <Ellipse cx="43" cy="33" rx="5" ry="6" fill={primaryColor} />
            <Ellipse cx="57" cy="33" rx="5" ry="6" fill={primaryColor} />
            <Circle cx="43" cy="32" r="2.5" fill="#ffffff" />
            <Circle cx="57" cy="32" r="2.5" fill="#ffffff" />
            <Path d="M45 43 Q50 47 55 43" stroke={primaryColor} strokeWidth="2" fill="none" />
            <Path d="M35 56 Q50 50 65 56 L65 90 Q50 98 35 90 Z" fill={primaryColor} />
            <Path d="M50 56 L50 85" stroke={secondaryColor} strokeWidth="3" />
            <Circle cx="50" cy="65" r="6" fill={secondaryColor} />
            <Circle cx="50" cy="65" r="3" fill={backgroundColor} />
            <Path d="M40 75 L60 75" stroke={secondaryColor} strokeWidth="2" />
            <Path d="M42 82 L58 82" stroke={secondaryColor} strokeWidth="2" opacity={0.7} />
          </G>
        );
    }
  };

  const orbSize = Math.max(4, size * 0.04);

  return (
    <View style={[localStyles.outerContainer, { width: size * 1.4, height: size * 1.4 }]}>
      {glowEnabled && (
        <>
          <Animated.View
            style={[
              localStyles.orbParticle,
              {
                width: orbSize,
                height: orbSize,
                borderRadius: orbSize / 2,
                backgroundColor: secondaryColor,
                opacity: orb1Opacity,
                transform: [{ translateX: orb1TranslateX }, { translateY: orb1TranslateY }],
              },
            ]}
          />
          <Animated.View
            style={[
              localStyles.orbParticle,
              {
                width: orbSize * 0.7,
                height: orbSize * 0.7,
                borderRadius: (orbSize * 0.7) / 2,
                backgroundColor: primaryColor,
                opacity: orb2Opacity,
                transform: [{ translateX: orb2TranslateX }, { translateY: orb2TranslateY }],
              },
            ]}
          />
          <Animated.View
            style={[
              localStyles.orbParticle,
              {
                width: orbSize * 0.5,
                height: orbSize * 0.5,
                borderRadius: (orbSize * 0.5) / 2,
                backgroundColor: secondaryColor,
                opacity: orb3Opacity,
                transform: [{ translateX: orb3TranslateX }, { translateY: orb3TranslateY }],
              },
            ]}
          />
        </>
      )}

      {glowEnabled && (
        <Animated.View
          style={[
            localStyles.glowRing,
            {
              width: size * 1.25,
              height: size * 1.25,
              borderRadius: size * 0.625,
              borderColor: primaryColor,
              opacity: glowAnim,
            },
          ]}
        />
      )}

      {glowEnabled && (
        <Animated.View
          style={[
            localStyles.glow,
            {
              width: size * 1.15,
              height: size * 1.15,
              backgroundColor: primaryColor,
              borderRadius: size * 0.575,
              opacity: glowAnim,
            },
          ]}
        />
      )}

      <Animated.View
        style={[
          localStyles.avatarWrapper,
          {
            transform: [
              { scale: pulseAnim },
              { translateY: floatAnim },
            ],
          },
        ]}
      >
        <View style={[localStyles.avatarContainer, { width: size, height: size, borderRadius: size * 0.15 }]}>
          <Svg width={size} height={size} viewBox="0 0 100 100">
            <Defs>
              <LinearGradient id="bgGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor={backgroundColor} stopOpacity={1} />
                <Stop offset="100%" stopColor={primaryColor} stopOpacity={0.3} />
              </LinearGradient>
              <LinearGradient id="bodyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor={primaryColor} stopOpacity={1} />
                <Stop offset="100%" stopColor={secondaryColor} stopOpacity={0.8} />
              </LinearGradient>
              <RadialGradient id="innerGlow" cx="50%" cy="40%" r="50%">
                <Stop offset="0%" stopColor={secondaryColor} stopOpacity={0.15} />
                <Stop offset="100%" stopColor={secondaryColor} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Rect x="0" y="0" width="100" height="100" rx="15" fill="url(#bgGradient)" />
            <Rect x="0" y="0" width="100" height="100" rx="15" fill="url(#innerGlow)" />
            {renderNaviBody()}
            <Rect x="0" y="0" width="100" height="100" rx="15" fill="none" stroke={secondaryColor} strokeWidth="2" opacity={0.5} />
          </Svg>
        </View>
      </Animated.View>
    </View>
  );
}

const localStyles = StyleSheet.create({
  outerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  glowRing: {
    position: 'absolute',
    borderWidth: 2,
  },
  glow: {
    position: 'absolute',
    ...Platform.select({
      ios: {
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 24,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  avatarWrapper: {
    zIndex: 2,
  },
  avatarContainer: {
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  orbParticle: {
    position: 'absolute',
    zIndex: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 6,
      },
    }),
  },
});
