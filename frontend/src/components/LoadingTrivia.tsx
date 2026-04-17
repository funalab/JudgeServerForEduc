import React, { useState, useEffect } from 'react';
import { Box, Text, Flex, Spinner } from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb } from 'lucide-react';
import { TRIVIA_LIST } from '../constants/trivia';


export const LoadingTrivia = () => {
  const [index, setIndex] =useState(() => Math.floor(Math.random() * TRIVIA_LIST.length));

  useEffect(() => {
    const timer = setInterval(() => {
      // 10秒ごとにランダムなインデックスを生成する
      setIndex((prevIndex) => {
        let nextIndex;
        do {
          nextIndex = Math.floor(Math.random() * TRIVIA_LIST.length);
        } while (nextIndex === prevIndex);
        return nextIndex;
      });
    }, 7000);

    return () => clearInterval(timer);
  }, []);

  return (
    <Box p={6} bg="blue.50" borderRadius="lg" border="1px solid" borderColor="blue.100" textAlign="center">
      <Flex direction="column" align="center" gap={4}>
        <Flex align="center" color="blue.600" fontWeight="bold">
          <Spinner size="sm" mr={3} speed="0.8s" />
          現在ジャッジサーバーで採点中です...
        </Flex>

        <Box minH="3em" display="flex" alignItems="center" justifyContent="center">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.4 }}
            >
              <Flex align="center" justify="center" gap={2}>
                <Lightbulb size={20} color="#ECC94B" fill="#FEFCBF" /> 
                <Text fontSize="md" color="gray.700" fontWeight="medium">
                  {TRIVIA_LIST[index]}
                </Text>
              </Flex>
            </motion.div>
          </AnimatePresence>
        </Box>
      </Flex>
    </Box>
  );
};
