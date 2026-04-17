"""
status.py (API_7, 8: B4向けの進捗確認関連)
"""

# ==========================================
# 画面4. 進捗状況画面(B4)
# ==========================================
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.config import User, Problem, Submission
from app.dependencies import get_db
from app.routers.auth import get_current_user
import json
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api/status", tags=["status"])


# API_7 "各生徒の全ての課題の進捗状況を返す"
@router.get("")
def get_status_of_all(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):

    # 全ユーザーと全課題を取得
    users = db.query(User).all()
    problems = db.query(Problem).all()

    # 最新の提出IDを抽出するサブクエリ（ユーザー名×課題から最大IDを抽出）
    subquery = (
        db.query(
            Submission.student_id,
            Submission.problem_id,
            func.max(Submission.id).label("max_id"),
        )
        .group_by(Submission.student_id, Submission.problem_id)
        .subquery()
    )

    # 最新の提出レコードを一括取得
    latest_submissions = (
        db.query(Submission).join(subquery, Submission.id == subquery.c.max_id).all()
    )

    submission_map = {(s.student_id, s.problem_id): s for s in latest_submissions}

    results = []

    for user in users:
        user_data = {"student_id": user.student_id, "name": user.name}

        for p in problems:
            sub = submission_map.get((user.student_id, p.problem_id))

            if sub:
                user_data[p.problem_id] = {
                    "status": sub.status,
                    "deadline": p.deadline,
                    "release_date": p.release_date,
                    "isReviewed": sub.isReviewed,
                    "reviewer": sub.reviewer,
                    "details": sub.details,
                }
            else:
                user_data[p.problem_id] = {
                    "status": "not_submitted",
                    "deadline": p.deadline,
                    "release_date": p.release_date,
                    "isReviewed": False,
                    "reviewer": "None",
                    "details": {},
                }
        results.append(user_data)
    return results


# ==========================================
# 画面5. 生徒別課題詳細画面(B4)
# ==========================================
# API_8 "各生徒の各課題の進捗状況を返す"
@router.get("/{problem_id}/{student_id}")
def get_user_progress(
    problem_id: str,
    student_id: str,
    submission_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    target_student = db.query(User).filter(User.student_id == student_id).first()

    if not target_student:
        raise HTTPException(status_code=404, detail="Student not found")
    name = target_student.name

    if current_user.student_id != "B4":
        raise HTTPException(
            status_code=403, detail="このページにアクセスする権限がありません。"
        )

    # db.query(Submission) から該当の提出を検索し、提出されたコード文字列と結果を返す。
    query = db.query(Submission).filter(
        Submission.student_id == student_id, Submission.problem_id == problem_id
    )
    if submission_id:
        latest_sub = query.filter(Submission.id == submission_id).first()
    else:
        latest_sub = query.order_by(Submission.id.desc()).first()

    result_data = {}

    if not latest_sub:
        raise HTTPException(status_code=404, detail="提出が見つかりません")
    if latest_sub.details:
        try:
            result_data = json.loads(latest_sub.details)
        except json.JSONDecodeError:
            result_data = {"error": "JSON parse error"}

    # Problemテーブルから、該当課題の問題文を取得
    problem = db.query(Problem).filter(Problem.problem_id == problem_id).first()
    problem_detail = problem.description if problem else "問題文が登録されていません"
    problem_criterion = problem.criterion if problem else "採点基準が登録されていません"

    return {
        "name": name,
        "code": latest_sub.code,
        "details": result_data,
        "problem_detail": problem_detail,
        "problem_criterion": problem_criterion,
        "status": latest_sub.status,
        "isReviewed": latest_sub.isReviewed,  # 追加
        "reviewer": latest_sub.reviewer,  # 追加
    }


@router.get("/{problem_id}/{student_id}/history")
def get_b4_submission_history(
    problem_id: str,
    student_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.student_id != "B4":
        raise HTTPException(status_code=403, detail="権限がありません")

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


# --- frontendからのB4 reviewに関するデータの受け取り方の定義 ---
class ReviewerRequest(BaseModel):
    student_id: str
    problem_id: str
    b4_name: str


class IsReviewedRequest(BaseModel):
    student_id: str
    problem_id: str
    status_str: str  # 仕様書のb4_nameの代わりに状況を入れるための変数


class UpdateStatusRequest(BaseModel):
    student_id: str
    problem_id: str
    b4_name: Optional[str] = None
    status_str: Optional[str] = None


# API_12, 13を統合
@router.post("/update-status")
def update_submission_status(
    request: UpdateStatusRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.student_id != "B4":
        raise HTTPException(status_code=403, detail="権限がありません")

    latest_sub = (
        db.query(Submission)
        .filter(
            Submission.student_id == request.student_id,
            Submission.problem_id == request.problem_id,
        )
        .order_by(Submission.id.desc())
        .first()
    )

    if not latest_sub:
        raise HTTPException(status_code=404, detail="提出が見つかりません")

    if request.b4_name is not None:
        latest_sub.reviewer = request.b4_name

    if request.status_str is not None:
        latest_sub.isReviewed = request.status_str

    db.commit()
    return {"message": "ステータスを更新しました"}
