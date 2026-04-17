import React from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Box, Flex } from '@chakra-ui/react';

interface BackLinkProps {
  text: string;
  to?: string;
  mt?: number | string;
  mb?: number | string;
}

export const BackLink = ({ text, to, mt = 0, mb = 6 }: BackLinkProps) => {
  const navigate = useNavigate();

  const content = (
    <Flex
      as="span"
      align="center"
      color="blue.500"
      fontWeight="bold"
      fontSize="md"
      px={3}
      py={2}
      ml={-3}
      borderRadius="full"
      transition="all 0.3s ease"
      _hover={{
        bg: "blue.50",
        color: "blue.700",
        "& .arrow-icon": { transform: 'translateX(-4px)' } 
      }}
    >
      <Box
        as="span"
        className="arrow-icon"
        mr={2}
        transition="transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      >
        ←
      </Box>
      <Box as="span">
        {text}
      </Box>
    </Flex>
  );

  const wrapperStyles = {
    display: "inline-block",
    mt: mt,
    mb: mb,
    cursor: "pointer",
    textDecoration: "none",
    _hover: { textDecoration: 'none' }
  };

  if (to) {
    // 一覧に戻るなど、リンク先が指定されている場合
    return (
      <Box as={RouterLink} to={to} {...wrapperStyles}>
        {content}
      </Box>
    );
  }

  return (
    // 指定されていなければ前の画面に遷移
    <Box as="a" onClick={() => navigate(-1)} {...wrapperStyles}>
      {content}
    </Box>
  );
};
