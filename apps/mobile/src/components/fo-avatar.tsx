import { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop, Text as SvgText } from "react-native-svg";
import type { FoMood } from "@foco/shared";

const mouths: Record<FoMood, string> = {
  happy: "M24 40 Q32 47 40 40",
  wave: "M25 40 Q32 46 39 40",
  celebrate: "M23 38 Q32 52 41 38 Z",
  sleepy: "M27 42 Q32 45 37 42",
  thinking: "M26 42 Q32 40 38 43",
};

const INK = "#1f2a24";

/**
 * Fô — o avatar do Foco (versão nativa, mesmo desenho do site).
 */
export function FoAvatar({ mood = "happy", size = 64, animate = true }: { mood?: FoMood; size?: number; animate?: boolean }) {
  const bob = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animate) return;
    const fast = mood === "celebrate";
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration: fast ? 400 : 1300, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: fast ? 400 : 1300, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [animate, mood, bob]);

  const translateY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, mood === "celebrate" ? -6 : -2] });
  const rotate = bob.interpolate({
    inputRange: [0, 1],
    outputRange: mood === "wave" ? ["-3deg", "3deg"] : mood === "celebrate" ? ["-4deg", "4deg"] : ["0deg", "0deg"],
  });

  const isCelebrate = mood === "celebrate";
  const isSleepy = mood === "sleepy";
  const thinking = mood === "thinking";

  return (
    <Animated.View style={{ width: size, height: size, transform: [{ translateY }, { rotate }] }}>
      <Svg viewBox="0 0 64 64" width={size} height={size}>
        <Defs>
          <LinearGradient id="fo-body" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#3bcf70" />
            <Stop offset="1" stopColor="#2f9e5a" />
          </LinearGradient>
          <LinearGradient id="fo-leaf" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#a5ecbd" />
            <Stop offset="1" stopColor="#2db35d" />
          </LinearGradient>
        </Defs>

        {/* brotinho */}
        <G>
          <Path d="M32 14 C32 9 33 6 36 4" stroke="#2f9e5a" strokeWidth={2} strokeLinecap="round" fill="none" />
          <Path d="M36 4 C40 2 44 4 44 8 C40 9 37 8 36 4 Z" fill="url(#fo-leaf)" />
          <Path d="M36 4 C32 1 28 3 28 7 C31 8 34 7 36 4 Z" fill="url(#fo-leaf)" opacity={0.85} />
        </G>

        {/* corpo */}
        <Rect x={8} y={14} width={48} height={44} rx={20} fill="url(#fo-body)" />
        <Ellipse cx={22} cy={26} rx={9} ry={6} fill="#fff" opacity={0.14} />

        {/* bochechas */}
        <Circle cx={18} cy={40} r={3.2} fill="#f28b82" opacity={0.45} />
        <Circle cx={46} cy={40} r={3.2} fill="#f28b82" opacity={0.45} />

        {/* olhos */}
        {isSleepy ? (
          <>
            <Path d="M19 34 Q24 37 29 34" stroke={INK} strokeWidth={2.4} strokeLinecap="round" fill="none" />
            <Path d="M35 34 Q40 37 45 34" stroke={INK} strokeWidth={2.4} strokeLinecap="round" fill="none" />
            <SvgText x={50} y={22} fontSize={9} fontWeight="700" fill={INK} opacity={0.6}>
              z
            </SvgText>
          </>
        ) : (
          <G>
            <Ellipse cx={24} cy={33} rx={4.6} ry={isCelebrate ? 5.4 : 5} fill="#fff" />
            <Ellipse cx={40} cy={33} rx={4.6} ry={isCelebrate ? 5.4 : 5} fill="#fff" />
            <Circle cx={thinking ? 26 : 25} cy={thinking ? 32 : 34} r={2.4} fill={INK} />
            <Circle cx={thinking ? 42 : 41} cy={thinking ? 32 : 34} r={2.4} fill={INK} />
            <Circle cx={26} cy={32.6} r={0.9} fill="#fff" />
            <Circle cx={42} cy={32.6} r={0.9} fill="#fff" />
          </G>
        )}

        {/* sobrancelhas */}
        {thinking && (
          <>
            <Path d="M19 26 L28 28" stroke={INK} strokeWidth={2} strokeLinecap="round" opacity={0.7} />
            <Path d="M36 27 L45 25" stroke={INK} strokeWidth={2} strokeLinecap="round" opacity={0.7} />
          </>
        )}

        {/* boca */}
        <Path d={mouths[mood]} stroke={INK} strokeWidth={2.4} strokeLinecap="round" fill={isCelebrate ? "#7a3a2e" : "none"} />

        {/* mãozinha */}
        {mood === "wave" && <Circle cx={57} cy={40} r={5} fill="#2db35d" />}
      </Svg>
    </Animated.View>
  );
}
