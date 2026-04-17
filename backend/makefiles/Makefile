# コンパイラとオプションの設定
CC = gcc
CFLAGS = -Wall -Wextra -O0

# ライブラリリンクの設定
LDLIBS = -lm

# 実行ファイル名
TARGET = a.out

# フォルダ内にあるすべての .c ファイルを自動で検索してリスト化
SRCS = $(wildcard *.c)

# .c の拡張子を .oに変換したリストを作成
OBJS = $(SRCS:.c=.o)

# 1. デフォルトのルール
$(TARGET): $(OBJS)
	# 【修正】LDLIBS をコマンドの最後に配置する
	$(CC) $(CFLAGS) -o $@ $^ $(LDLIBS)

# 2. 各 .c ファイルから .o ファイルを作るためのルール
%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

# 3. お掃除用のルール
clean:
	rm -f $(OBJS) $(TARGET)
