from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.config import User, Mail
from app.routers.auth import get_current_user
from pydantic import BaseModel

import smtplib
import ssl
from email.mime.text import MIMEText
from app.secret import B4_to_mail, B3_to_mail, B4_to_password, postfix

router = APIRouter(prefix="/api/gmail", tags=["gmail"])


# --- frontendからのB4 コメントに関するクラス定義
class MailRequest(BaseModel):
    student_id: str
    problem_id: str
    b4_name: str
    content: str
    status: str


@router.post("")
async def get_mail_content_and_send(
    request: MailRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.student_id != "B4":
        raise HTTPException(status_code=403, detail="権限がありません")

    new_mail = Mail(
        student_id=request.student_id,
        problem_id=request.problem_id,
        content=request.content,
        b4_name=request.b4_name,
        status=request.status,
    )

    db.add(new_mail)
    db.commit()

    account = f"{B4_to_mail[request.b4_name]}{postfix}"
    send_address = f"{B3_to_mail[request.student_id]}{postfix}"
    password = B4_to_password[request.b4_name]
    student = db.query(User).filter_by(student_id=request.student_id).first()
    student_name = student.name if student else "不明なユーザー"
    subject = f"{request.problem_id}の結果"
    body = f"担当者：{request.b4_name}\n課題：{request.problem_id}\n提出結果：{request.status}\n------------------------------------------\n{request.content}"

    background_tasks.add_task(
        send_gmail_sync, send_address, subject, body, password, account
    )

    return {"message": "Success"}


def send_gmail_sync(
    send_address: str, subject: str, body: str, password: str, account: str
):
    msg = MIMEText(body, "plain")
    msg["Subject"] = subject
    msg["To"] = send_address
    msg["From"] = account
    msg["Cc"] = "m1" + postfix

    context = ssl.create_default_context()
    with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=context) as server:
        server.login(account, password)
        server.send_message(msg)


@router.get("/{problem_id}")
async def get_content_from_problem_id(
    problem_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.student_id != "B4":
        raise HTTPException(status_code=403, detail="権限がありません")
    problems = db.query(Mail).filter_by(problem_id=problem_id).all()
    results = []
    for problem in problems:
        student = db.query(User).filter_by(student_id=problem.student_id).first()
        student_name = student.name if student else "不明なユーザー"
        results.append(
            {
                "student_id": problem.student_id,
                "name": student_name,
                "problem_id": problem.problem_id,
                "content": problem.content,
                "b4_name": problem.b4_name,
                "submit_time": problem.submit_time,
                "status": problem.status,
            }
        )
    return results


@router.get("")
async def get_my_comments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # B4は対象外（B4は {problem_id} 付きのAPIを使うため）
    if current_user.student_id == "B4":
        raise HTTPException(status_code=403, detail="学生専用のエンドポイントです")

    # DBから、ログイン中の学生(student_id)宛てのメール履歴を全て取得
    problems = db.query(Mail).filter_by(student_id=current_user.student_id).all()

    results = []
    for problem in problems:
        student = db.query(User).filter_by(student_id=problem.student_id).first()
        student_name = student.name if student else "不明なユーザー"
        results.append(
            {
                "student_id": problem.student_id,
                "name": student_name,
                "problem_id": problem.problem_id,
                "content": problem.content,
                "b4_name": problem.b4_name,
                "submit_time": problem.submit_time,
                "status": problem.status,
            }
        )
    return results
