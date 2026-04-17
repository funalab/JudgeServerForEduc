"""
auth.py (API_1, 2: ログイン関連)
"""

# ==========================================
# 画面1. ログイン画面 (B3/B4)
# ==========================================
import jwt
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.config import (
    User,
    verify_password,
    SECRET_KEY,
    ALGORITHM,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)
from app.dependencies import get_db

# FastAPIへ、このURLでログインしてもらう仕様だよ、と伝える設定
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

router = APIRouter(prefix="/api/auth", tags=["auth"])


# Reactから送られてくるUser関連のjsonデータの型定義(config.pyに移植？)
class UserAuth(BaseModel):
    student_id: str
    password: str
    name: str = None  # 新規登録時のみ使用


# -----------------------------------------------------------------------
# JWTを発行する関数
# -----------------------------------------------------------------------
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    # SECRET_KEYを使って、署名付きで改ざん不可能な暗号化サインを作成
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


# -----------------------------------------------------------------------
# トークンを解読し、現在アクセスしているユーザを特定する関数(期限切れ、偽造をcheck)
# -----------------------------------------------------------------------
def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="認証情報が無効です",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # トークンを秘密鍵でデコード(解読)する
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        student_id: str = payload.get("sub")
        if student_id is None:
            raise credentials_exception

    except jwt.PyJWTError:  # 期限切れ・改ざんがあった場合はここで弾く
        raise credentials_exception

    # デコードして得たstudent_idでDBを検索
    user = db.query(User).filter(User.student_id == student_id).first()
    if user is None:
        raise credentials_exception

    return user


# API_1 "ユーザー情報の提出ボタン"
@router.post("/login")
def login(data: UserAuth, db: Session = Depends(get_db)):
    # 1. データベースからユーザを探す
    user = db.query(User).filter(User.student_id == data.student_id).first()

    print(data.password, user.password_hash)
    # 2. ユーザが存在し、登録されたパスワードが一致するか検証
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="学籍番号またはパスワードが間違っています。",
        )

    # 3. JWTの中に「学籍番号(sub)」と「権限(role)」を埋め込んでaccess_tokenを作成
    role = "B4" if user.student_id == "B4" else "B3"
    access_token = create_access_token(data={"sub": user.student_id, "role": role})

    return {"accesstoken": access_token, "tokentype": "bearer"}


# API_2 "認証結果の伝達（間違い、生徒、B4どれかを返す！）"
@router.get("/me")
def check_role(current_user: User = Depends(get_current_user)):
    role = "B4" if current_user.student_id == "B4" else "B3"

    return {
        "student_id": current_user.student_id,
        "name": current_user.name,
        "role": role,
        "is_verified": True,
    }
