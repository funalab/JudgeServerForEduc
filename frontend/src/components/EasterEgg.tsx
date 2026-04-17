import React, { useState, useEffect } from 'react';
import { Box, Text } from '@chakra-ui/react';
import { motion } from 'framer-motion';

interface Props {
  userName: string;
  onComplete: () => void;
}

// 線虫の動きを定義するためのインターフェース
interface Nematode {
  id: number;
  startX: number;
  startY: number;
  size: number;
  duration: number;
  baseRotation: number;
  moveX: number[];
  moveY: number[];
  moveRotate: number[];
}

export const EasterEgg: React.FC<Props> = ({ userName, onComplete }) => {
  const [nematodes, setNematodes] = useState<Nematode[]>([]);

  useEffect(() => {
    // 巨大な線虫を40匹生成（大きくした分、数は少し減らしてパフォーマンスと視認性を調整）
    const generated = Array.from({ length: 40 }).map((_, i) => {
      return {
        id: i,
        startX: Math.random() * 100, // 初期位置 (vw)
        startY: Math.random() * 100, // 初期位置 (vh)
        size: Math.random() * 70 + 80, // 80px ~ 150px（巨大）
        duration: Math.random() * 2 + 1.5, // 1.5秒〜3.5秒で1サイクル（動きを少し激しく）
        baseRotation: Math.random() * 360,
        // わちゃわちゃ這い回るためのランダムな移動経路
        moveX: [0, Math.random() * 300 - 150, Math.random() * 300 - 150, 0],
        moveY: [0, Math.random() * 300 - 150, Math.random() * 300 - 150, 0],
        // くねくね感を出すための回転キーフレーム
        moveRotate: [0, Math.random() * 180 - 90, Math.random() * -180 + 90, 0]
      };
    });
    setNematodes(generated);

    // 10秒後に自動で終了して元の画面へ戻る
    const timer = setTimeout(() => onComplete(), 5000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      w="100vw"
      h="100vh"
      bg="#050505"
      zIndex={9999}
      overflow="hidden"
    >
      {nematodes.map((worm) => (
        <motion.div
          key={worm.id}
          style={{
            position: 'absolute',
            left: `${worm.startX}vw`,
            top: `${worm.startY}vh`,
            fontSize: `${worm.size}px`,
            color: 'rgba(200, 255, 200, 0.7)', // 少し生々しい半透明の緑白色
            transformOrigin: 'center center',
          }}
          initial={{ opacity: 0 }}
          animate={{
            // 登場時と退場時にフェードイン・フェードアウト
            opacity: [0, 1, 1, 0], 
            x: worm.moveX,
            y: worm.moveY,
            // 基準の角度に対してランダムな回転を足す
            rotate: worm.moveRotate.map(r => r + worm.baseRotation),
            // 尺取り虫のように伸縮させる
            scale: [1, 1.3, 0.8, 1] 
          }}
          transition={{
            // 動きのループ
            duration: worm.duration,
            repeat: Infinity,
            ease: "easeInOut",
            // 全体のフェードイン・アウト用の10秒タイマー
            opacity: { duration: 10, times: [0, 0.1, 0.9, 1], repeat: 0 } 
          }}
        >
          〰️
        </motion.div>
      ))}

      {/* スキップボタン（右下にひっそりと配置） */}
      <Box position="absolute" bottom="20px" right="20px" zIndex={10} cursor="pointer" onClick={onComplete}>
        <Text color="gray.700" fontSize="sm" _hover={{ color: "white" }}>[ スキップ ]</Text>
      </Box>
    </Box>
  );
};
