import requests
from app.config import SLACK_WEBHOOK_URL, Problem, Submission, User
from app.dependencies import SessionLocal
import schedule
import time
from datetime import datetime, timezone, timedelta
from typing import Dict
import os

exempt_ids_str = os.getenv("EXEMPT_STUDENT_IDS", "B4")
EXEMPT_STUDENT_IDS = exempt_ids_str.split(",")

JST = timezone(timedelta(hours=9), "JST")


def send_slack_notification(student_name: str, problem_title: str, status: str):
    if not SLACK_WEBHOOK_URL:
        return
    if status == "AC":
        message = {
            "text": f"`{student_name}` さんが問題「{problem_title}」を提出し、結果は`{status}` でした。\nB4の皆さんは確認お願いします。"
        }
        try:
            requests.post(SLACK_WEBHOOK_URL, json=message, timeout=50)
        except Exception as e:
            print(f"slack通知エラー:{e}")


def send_overdue_notification(
    problem_title: str, deadline_str: str, student_statuses: Dict[str, str]
):
    if not SLACK_WEBHOOK_URL:
        return

    if all(status == "AC" for status in student_statuses.values()):
        return
    lines = [f"🚨 *{problem_title}課題締め切り ({deadline_str})*"]
    for student, status in student_statuses.items():
        display_status = status
        if status in ["WA", "CE", "RE", "TLE", "ME"]:
            display_status = f"{status}あり"
        elif status == "not_submitted":
            display_status = "未提出"
        lines.append(f"{student}さん： {display_status}")

    message = {"text": "\n".join(lines)}
    try:
        requests.post(SLACK_WEBHOOK_URL, json=message, timeout=5)
    except Exception as e:
        print(f"slack通知エラー(未提出者アラート):{e}")


def get_overdue_data_notification():
    db = SessionLocal()
    try:
        users = db.query(User).filter(User.student_id.notin_(EXEMPT_STUDENT_IDS)).all()
        user_names = {user.student_id: user.name for user in users}
        problems = db.query(Problem).all()

        now_jst = datetime.now(JST)

        for problem in problems:
            if not problem.deadline:
                continue

            try:
                deadline_dt = datetime.strptime(problem.deadline, "%Y/%m/%d %H:%M")
                deadline_aware = deadline_dt.replace(tzinfo=JST)
            except ValueError:
                print(f"日付パースエラー: {problem.deadline}")
                continue

            if deadline_aware < now:
                student_statuses = {}
                for student_id, name in user_names.items():
                    latest_sub = (
                        db.query(Submission)
                        .filter(
                            Submission.student_id == student_id,
                            Submission.problem_id == problem.problem_id,
                        )
                        .order_by(Submission.id.desc())
                        .first()
                    )

                    if latest_sub:
                        student_statuses[name] = latest_sub.status
                    else:
                        student_statuses[name] = "not_submitted"

                formatted_deadline = (
                    f"{problem.deadline[4:6]}/{problem.deadline[6:8]}"
                    if len(problem.deadline) == 8
                    else problem.deadline
                )

                send_overdue_notification(
                    problem.problem_id, formatted_deadline, student_statuses
                )
    except Exception as e:
        print(f"DBからのデータ取得エラー: {e}")
    finally:
        db.close()


schedule.every().day.at("00:00").do(get_overdue_data_notification)

if __name__ == "__main__":
    while True:
        schedule.run_pending()
        time.sleep(60 * 5)
