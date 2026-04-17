import os
from sqlalchemy import (
    create_engine,
    Column,
    Integer,
    String,
    Text,
    ForeignKey,
    Boolean,
    DateTime,
    Float,
)
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from celery import Celery
from passlib.context import CryptContext
from datetime import datetime
from sqlalchemy.dialects.postgresql import JSONB

# 保存先フォルダの作成
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://redis:6379/0")

MAKEFILE_DIR = "makefiles"
os.makedirs(MAKEFILE_DIR, exist_ok=True)

SLACK_WEBHOOK_URL = os.getenv("SLACK_WEBHOOK_URL", "")

# 1. databaseとの接続
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("環境変数 DATABASE_URL が設定されていません。")

# 2. databaseとの通信を司る、Engineの作成
engine = create_engine(DATABASE_URL, echo=False)

# データベース操作の窓口(Session)を作る準備
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 3. これから作るtableの設計図となる、Baseクラスの作成 (これ以降作成するtableは、全てこのBaseクラスを継承)
Base = declarative_base()


# 4. 設計図の定義 (SQLの"CREATE TABLE problems (...)" に相当)
class User(Base):
    __tablename__ = "users"

    student_id = Column(String, primary_key=True)
    name = Column(String, nullable=False)  # 氏名
    password_hash = Column(String, nullable=False)

    # [データベース同士の関係性の定義] 1人の user は 複数の 提出履歴submissons をもつ
    submissions = relationship("Submission", back_populates="user")
    mails = relationship("Mail", back_populates="user")


## 問題情報database
class Problem(Base):
    # データベース内のテーブル名を指定
    __tablename__ = "problems"

    # 列の定義
    problem_id = Column(String, primary_key=True)  # 問題のid (ex. "C1")
    title = Column(String, nullable=False)  # タイトル
    description = Column(Text)  # 問題文
    deadline = Column(String)  # 締切
    release_date = Column(String)  # 課題にアクセス可能になる日付
    criterion = Column(Text)  # 採点基準
    time_limit = Column(Float, default=4.0)  # 秒単位なので Float（浮動小数点）
    memory_limit = Column(Integer, default=256)  # MB単位なので Integer（整数）

    # [データベース同士の関係性の定義] 1つの問題は 複数のテストケース と 提出履歴 を持つ
    test_cases = relationship("TestCase", back_populates="problem")
    submissions = relationship("Submission", back_populates="problem")
    mails = relationship("Mail", back_populates="problem")


## テストケースdatabase
class TestCase(Base):
    __tablename__ = "test_cases"

    id = Column(Integer, primary_key=True)

    # ForeignKey: 「これはproblemsテーブルのidと紐づいていますよ」という名札
    problem_id = Column(String, ForeignKey("problems.problem_id"), nullable=False)

    input_file = Column(Text, nullable=False)  # 判定用の入力値
    expected_output = Column(Text, nullable=False)  # Ground Truth
    args_file = Column(Text, nullable=True)  # コマンドライン引数の追加

    # [データベース同士の関係性の定義] このTestcaseクラスの「親」である問題を参照する
    problem = relationship("Problem", back_populates="test_cases")


class Submission(Base):
    # SQLの"CREATE TABLE submissions (...)"に相当
    __tablename__ = "submissions"

    id = Column(
        Integer, primary_key=True
    )  # 提出ID(Integerオプションで、自動で連番にしてくれる)
    student_id = Column(
        String, ForeignKey("users.student_id"), nullable=False
    )  # 提出した生徒のuser
    problem_id = Column(
        String, ForeignKey("problems.problem_id"), nullable=False
    )  # 問題のid

    code = Column(JSONB, nullable=False)  # 提出されたコードを保存
    details = Column(Text)  # 課題の詳細をJSONとして保存する
    status = Column(String, nullable=False)  # 判定状態 (例: "WJ", "AC", "WA")
    isReviewed = Column(
        String, default="未確認"
    )  # B4の確認状態（"未確認", "確認中", "修正要", "OK" の4値分類）
    reviewer = Column(String)  # 担当者名
    submit_time = Column(DateTime, default=datetime.now)  # 提出された時間

    # [データベース同士の関係性の定義] このTestcaseクラスの「親」である問題を参照する
    user = relationship("User", back_populates="submissions")
    problem = relationship("Problem", back_populates="submissions")


class Mail(Base):
    __tablename__ = "mails"

    id = Column(
        Integer, primary_key=True
    )  # 提出ID(Integerオプションで、自動で連番にしてくれる)
    student_id = Column(
        String, ForeignKey("users.student_id"), nullable=False
    )  # 提出した生徒のuser
    problem_id = Column(
        String, ForeignKey("problems.problem_id"), nullable=False
    )  # 問題のid

    content = Column(Text, nullable=False)  # 送信したいメールの内容
    b4_name = Column(String)  # メールを送ったB4の名前
    submit_time = Column(DateTime, default=datetime.now)  # 提出された時間
    status = Column(String, nullable=False)  # 判定状態 (例: "WJ", "AC", "WA")

    user = relationship("User", back_populates="mails")
    problem = relationship("Problem", back_populates="mails")


# --- JWTとパスワードハッシュ化の設定 ---
SECRET_KEY = os.getenv("SECRET_KEY")

if not SECRET_KEY:
    raise ValueError("環境変数 SECRET_KEY が設定されていません。")
  
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# bcryptアルゴリズムを用いた暗号化の設定
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# 照合用関数（入力された平文パスワードと、DBのハッシュを比較）
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


# 暗号化用関数（平文パスワードを不可逆のハッシュ値に変換）
def get_password_hash(password):
    return pwd_context.hash(password)
