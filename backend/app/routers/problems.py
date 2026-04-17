"""
problems.py (API_3, 4: 課題一覧・詳細関連)
"""

import json
from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.routers.auth import get_current_user

# 最新の提出を特定するために追加
from sqlalchemy import func
from app.dependencies import get_db
from app.config import Problem, Submission, User, TestCase

router = APIRouter(prefix="/api/problems", tags=["problems"])
JST = timezone(timedelta(hours=9), "JST")

# ==========================================
# 画面2. 課題一覧画面(B3)
# ==========================================

# API_3 "全体画面で、課題全体の進捗を表示する(C1, AC, 締切… などを返す)"

@router.get("")
def get_problems(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    student_id = current_user.student_id
    name = current_user.name

    # 1. すべての課題を取得
    all_problems = db.query(Problem).all()

    # 2. この生徒の課題ごとの「最新の提出ID」を取得するサブクエリ
    # 同一課題への複数提出のうち、IDが最大のものが最新とみなす
    subquery = (
        db.query(Submission.problem_id, func.max(Submission.id).label("max_id"))
        .filter(Submission.student_id == student_id)
        .group_by(Submission.problem_id)
        .subquery()
    )

    # 3. 最新の提出レコードを丸ごと取得
    latest_submissions = (
        db.query(Submission).join(subquery, Submission.id == subquery.c.max_id).all()
    )

    # 辞書化して検索しやすくする {problem_id: status}
    status_map = {s.problem_id: s.status for s in latest_submissions}
    revised_map = {s.problem_id: s.isReviewed for s in latest_submissions}
    reviewer_map = {s.problem_id: s.reviewer for s in latest_submissions}
    details_map = {s.problem_id: s.details for s in latest_submissions}

    # 問題一覧を返す
    return [
        {
            "name": name,
            "problem_id": p.problem_id,
            "title": p.title,
            # 提出があればそのstatus、なければ未提出を返す
            "status": status_map.get(p.problem_id, "not_submitted"),
            "deadline": p.deadline,
            "release_date": p.release_date,
            "isReviewed": revised_map.get(p.problem_id),
            "reviewer": reviewer_map.get(p.problem_id),
            "details": details_map.get(p.problem_id, {}),
        }
        for p in all_problems
    ]


# ==========================================
# 画面3-1. 課題詳細画面_閲覧(B3)
# ==========================================


# API_4 "C1,2,…10 各課題の「内容」をとってきて、表示"
@router.get("/{problem_id}")
def get_problem_detail(
    problem_id: str,
    submission_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    student_id = current_user.student_id
    name = current_user.name

    # 1_1. 課題の基本情報を取得
    problem = db.query(Problem).filter(Problem.problem_id == problem_id).first()
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")

    # 未公開の課題のurlが叩かれた場合はエラーを返し、詳細を見れないようにする
    if problem.release_date:
        try:
            # DBの形式 "YYYY/mm/DD HH:MM" に合わせてパースし、JSTのタイムゾーンを付与
            release_date_dt = datetime.strptime(problem.release_date, "%Y/%m/%d %H:%M")
            release_date_aware = release_date_dt.replace(tzinfo=JST)

            # 現在時刻(JST)と比較
            current_time_jst = datetime.now(JST)
            if release_date_aware > current_time_jst:
                raise HTTPException(
                    status_code=403,
                    detail=f"この課題は {problem.release_date} に公開されます。",
                )    
            
        except ValueError as e:
            print(f"Date parsing error: {e}")
            pass

    # 1_2. テストケースの例を2件取得する
    test_cases = (
        db.query(TestCase)
        .filter(TestCase.problem_id == problem_id)
        .order_by(TestCase.id.asc())  # idの小さい順に並べ！
        .limit(2)  # 2件だけ取得
        .all()
    )

    # フロントエンドに渡しやすいようリストで整形
    formatted_samples = [
        {
            "name": f"入力例{i + 1}",
            "input": tc.input_file,
            "output": tc.expected_output,
            "args": tc.args_file,
        }
        for i, tc in enumerate(test_cases)
    ]

    # 2. 表示対象の提出を取得
    if submission_id:
        # 特定の提出が指定された場合
        target_submission = (
            db.query(Submission)
            .filter(
                Submission.id == submission_id,
                Submission.student_id == student_id,
                Submission.problem_id == problem_id,
            )
            .first()
        )
        print("target_submission")
    else:
        # 指定がない場合は最新の提出を取得
        target_submission = (
            db.query(Submission)
            .filter(
                Submission.student_id == student_id, Submission.problem_id == problem_id
            )
            .order_by(Submission.id.desc())
            .first()
        )

    # detailsをパースする処理
    details_data = {}
    if target_submission and target_submission.details:
        try:
            # JSON文字列を辞書型に変換
            details_data = json.loads(target_submission.details)
        except json.JSONDecodeError:
            # 特定のエラー（JSONの形式不正）のみをキャッチ
            details_data = {"error": "Failed to load details"}
        except Exception as e:
            # それ以外の予期せぬエラーはExceptionとして受け取り、ログ等に出すのが安全
            print(f"Unexpected error: {e}")
            details_data = {"error": "Internal data error"}

    # 3. 結合して返す
    return {
        "student_id": student_id,
        "name": name,
        "problem_id": problem.problem_id,
        "title": problem.title,
        "problem_detail": problem.description,  # Problemモデルのカラム名に合わせて調整
        "time_limit": problem.time_limit,
        "memory_limit": problem.memory_limit,
        "status": target_submission.status if target_submission else "not_submitted",
        "submitted_code": target_submission.code if target_submission else None,
        "details": details_data,
        "sample_cases": formatted_samples,  # テストケース例
        "isReviewed": target_submission.isReviewed if target_submission else "未確認",
        "reviewer": target_submission.reviewer if target_submission else "",
    }


# 各テストケースのinput/expectedのダウンロードボタンが押されたらinput/expectedファイルを返すAPI
@router.get("/testcases/{problem_id}/{test_name}/{data_type}")
def get_testcase_data(
    problem_id: str,
    test_name: str,
    data_type: str,  # 'input'/'expected'
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if data_type not in ["input", "expected"]:
        raise HTTPException(status_code=400, detail="Invalid data type")

    try:
        parts = test_name.split("_")
        idx = int(parts[1]) - 1
    except (ValueError, IndexError):
        raise HTTPException(status_code=400, detail="Invalid test case name")

    test_case = (
        db.query(TestCase)
        .filter(TestCase.problem_id == problem_id)
        .order_by(TestCase.id.asc())
        .offset(idx)
        .first()
    )

    if not test_case:
        raise HTTPException(status_code=404, detail="Test case not found")

    # typeに応じて返すカラムを切り替える
    content = (
        test_case.input_file if data_type == "input" else test_case.expected_output
    )

    return {"content": content}
