"""
submission.py (API_5, 6: 提出・ジャッジ関連)
"""

import os
import json
from typing import List

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_db
import uuid
from app.config import User, Problem, TestCase, Submission
from app.config import UPLOAD_FOLDER
from app.asyncs.worker import judge_task
from app.routers.auth import get_current_user

router = APIRouter(prefix="/api/submission", tags=["submission"])


# ==========================================
# API_5: 生徒が提出するボタン (ジャッジの実行)
# ==========================================
@router.post("/{problem_id}") 
async def submit_code(
    # student_id: str,
    problem_id: str,
    files: List[UploadFile] = File(...),  # 複数ファイルを受け取る
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    student_id = current_user.student_id

    # 提出ごとの作業ディレクトリ作成
    unique_id = uuid.uuid4().hex  # ランダムな文字列の作成
    work_dir = os.path.join(UPLOAD_FOLDER, f"{student_id}_{problem_id}_{unique_id}")
    os.makedirs(work_dir, exist_ok=True)

    # 複数ファイルの保存処理
    code_texts = {}
    for file in files:
        content_bytes = await file.read()
        
        safe_filename = os.path.basename(file.filename) # 悪意のある"../"等を含むファイルパス名を無効化
        file_path = os.path.join(work_dir, safe_filename)
        
        with open(file_path, "wb") as f:
            f.write(content_bytes)

        decoded_text = content_bytes.decode("utf-8", errors="replace")
        code_texts[safe_filename] = decoded_text

    # ユーザとテストケースの存在確認
    user = db.query(User).filter(User.student_id == student_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="生徒が見つかりません")

    test_cases = db.query(TestCase).filter(TestCase.problem_id == problem_id).all()
    if not test_cases:
        raise HTTPException(status_code=404, detail="テストケースが見つかりません")
    new_sub = Submission(
        student_id=student_id,
        problem_id=problem_id,
        code=code_texts,
        status="WJ",
        details="{}",
    )

    db.add(new_sub)
    db.commit()
    db.refresh(
        new_sub
    ) 
    
    judge_task.delay(new_sub.id, student_id, problem_id, work_dir)

    return {"files_id": new_sub.id}


# ==========================================
# API_6: ジャッジ結果を返す
# ==========================================
@router.get("/{problem_id}/results") 
def get_results(
    # student_id: str,
    problem_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    student_id = current_user.student_id

    submission = (
        db.query(Submission)
        .filter(
            Submission.student_id == student_id, Submission.problem_id == problem_id
        )
        .order_by(Submission.id.desc())
        .first()
    )

    if not submission:
        raise HTTPException(status_code=404, detail="提出履歴が見つかりません")

    details_data = {}
    if submission.details:
        try:
            details_data = json.loads(submission.details)
        except json.JSONDecodeError:
            details_data = {"error": "Failed to load details"}

    return {"status": submission.status, "details": details_data}


# ==========================================
# 画面6. 課題提出履歴画面(B3)
# ==========================================
# API_10 "各生徒の課題別の提出履歴を返す"
@router.get("/{problem_id}/history")
def get_submission_history(
    problem_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),  # 認証済みユーザーを取得
):
    student_id = current_user.student_id

    # 該当する生徒・課題の提出履歴を全て取得（IDの降順、新しい順）
    submissions = (
        db.query(Submission)
        .filter(
            Submission.student_id == student_id, Submission.problem_id == problem_id
        )
        .order_by(Submission.id.desc())
        .all()
    )
    history = []
    for s in submissions:
        details_data = {}
        if s.details:
            try:
                details_data = json.loads(s.details)
            except json.JSONDecodeError:
                details_data = {"error": "JSON parse error"}

        history.append(
            {
                "id": s.id,
                "status": s.status,
                "code": s.code,
                "details": details_data,
                "submit_time": s.submit_time.isoformat() if s.submit_time else None,
            }
        )

    return history
