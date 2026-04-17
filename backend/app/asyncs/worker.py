import os
import subprocess
import json
import shutil
from celery import Celery
import re
import shlex

from app.config import (
    SessionLocal,
    Submission,
    TestCase,
    User,
    Problem,
    CELERY_BROKER_URL,
    MAKEFILE_DIR,
)
from app.notification.slack import send_slack_notification


celery_app = Celery("worker", broker=CELERY_BROKER_URL)


@celery_app.task
def judge_task(submission_id: int, student_id: str, problem_id: str, work_dir: str):
    """非同期でジャッジする関数"""
    db = SessionLocal()
    try:
        # 課題情報を取得して制限値を設定
        problem = db.query(Problem).filter(Problem.problem_id == problem_id).first()

        # 課題ごとに設定がある場合はそれを使い、なければデフォルト値を使う
        JUDGE_TIME_LIMIT = getattr(problem, "time_limit", 4.0)  # デフォルト4秒
        MEMORY_LIMIT = getattr(problem, "memory_limit", 256)  # デフォルト256MB
        COMPILE_TIME_LIMIT = 15  # コンパイルの時間制限

        submission = db.query(Submission).filter(Submission.id == submission_id).first()
        if not submission:
            return "submimssion not found"

        test_cases = (
            db.query(TestCase)
            .filter(TestCase.problem_id == problem_id)
            .order_by(TestCase.id.asc())
            .all()
        )
        if not test_cases:
            submission.status = "CE"
            db.commit()
            return "Testcases not found"

        # 以下はすみれが書いてくれたsubmissions.pyの内容のコピペ(一部この関数ように直したけど)
        abs_work_dir = os.path.abspath(work_dir)
        final_status = "WJ"
        judge_details = {}

        host_project_dir = os.getenv("HOST_PROJECT_DIR", "")
        if not host_project_dir:
            raise RuntimeError("HOST_PROJECT_DIR is not set in environment")

        rel_work_dir = os.path.relpath(abs_work_dir, "/app")
        host_abs_work_dir = os.path.join(host_project_dir, "backend", rel_work_dir)

        JUDGE_IMAGE = "my_judge_worker_image"

        # 例: makefiles/Makefile_C1 を探す
        server_makefile_path = os.path.join(MAKEFILE_DIR, "Makefile")
        target_makefile_path = os.path.join(abs_work_dir, "Makefile")

        if not os.path.exists(server_makefile_path):
            # サーバー側にMakefileがない場合
            submission.status = "CE"
            judge_details["error"] = "Makefile missing on server"
            submission.details = json.dumps(judge_details, ensure_ascii=False)
            db.commit()
            return "Makefile missing"

        # 学生のフォルダに本物の Makefile を上書きコピー
        shutil.copyfile(server_makefile_path, target_makefile_path)

        # ステップA: Makefileを用いたコンパイル。使い捨てのコンテナ内で実行
        compile_cmd = [
            "docker",
            "run",
            "--rm",
            "--net",
            "none",  # ネットワーク遮断
            "-v",
            f"{host_abs_work_dir}:/workspace",
            "-w",
            "/workspace",
            JUDGE_IMAGE,
            "make",
        ]
        try:
            compile_proc = subprocess.run(
                compile_cmd,
                cwd=abs_work_dir,
                capture_output=True,
                text=True,
                timeout=COMPILE_TIME_LIMIT,
            )
            if compile_proc.returncode != 0:
                final_status = "CE"
                judge_details["error"] = compile_proc.stderr.strip()
        except subprocess.TimeoutExpired:
            final_status = "CE"
            judge_details["error"] = "Compile Timeout"

        # ステップB: テストケースの実行
        if final_status != "CE":
            final_status = "AC"

            # 全課題をWJで初期化
            for i, tc in enumerate(test_cases):
                test_name = f"test_{i + 1}"
                args_content = tc.args_file.strip() if tc.args_file else ""
                has_args = bool(args_content)

                input_text = tc.input_file.strip()
                has_input = bool(input_text) and input_text not in ("dummy.txt")
                judge_details[test_name] = {
                    "status": "WJ",
                    "args": args_content,
                    "input": tc.input_file,
                    "expected": tc.expected_output,
                    "output": "ジャッジ中",
                }
            submission.details = json.dumps(judge_details, ensure_ascii=False)
            db.commit()

            for i, tc in enumerate(test_cases):
                test_name = f"test_{i + 1}"

                container_name = f"judge_sub{submission_id}_tc{i + 1}"

                # args.txtがあるかどうかでコマンドを変更
                args_content = tc.args_file.strip() if tc.args_file else ""
                has_args = bool(args_content)

                # shlex を用いたコマンドインジェクションの防止
                safe_args = ""
                if has_args:
                    safe_args = " ".join(
                        shlex.quote(arg) for arg in shlex.split(args_content)
                    )

                if problem_id == "C11":
                    # 引数文字列の中から ".txt" で終わる単語（ファイル名）を抽出
                    txt_files = re.findall(r"[\w\.-]+\.txt|3", args_content)

                    if txt_files:
                        # 見つかったファイル名（例: test_a.txt）を名前として採用
                        input_filename = txt_files[-1]
                        input_path = os.path.join(abs_work_dir, input_filename)
                    else:
                        input_path = os.path.join(abs_work_dir, "input.txt")
                else:
                    # C11以外の場合は、固定で input.txt を作成する
                    input_path = os.path.join(abs_work_dir, "input.txt")

                output_path = os.path.join(abs_work_dir, "output.txt")

                with open(input_path, "w") as f:
                    f.write(tc.input_file)

                valgrind_opts = (
                    "--leak-check=full "
                    "--show-leak-kinds=all "
                    "--errors-for-leak-kinds=all "
                    "--track-origins=yes "
                    "--error-exitcode=250 "
                )

                input_text = tc.input_file.strip()
                has_input = bool(input_text) and input_text not in ("dummy.txt")
                if problem_id == "C11":
                    if has_args:
                        exec_compile_cmd = f"./a.out {safe_args} > output.txt"
                    else:
                        exec_compile_cmd = "./a.out < input.txt > output.txt"
                else:
                    # C11以外の場合の元のコマンド
                    if has_args:
                        exec_compile_cmd = f"./a.out {safe_args} > output.txt"
                    else:
                        exec_compile_cmd = "./a.out < input.txt > output.txt"
                exec_cmd = [
                    "docker",
                    "run",
                    "--rm",
                    "--name",
                    container_name,  # dockerに明示的な名前をする
                    "--net",
                    "none",  # 外部通信を完全遮断
                    "--memory",
                    f"{MEMORY_LIMIT}m",  # メモリ使用量を256MBに制限
                    "--cpus",
                    "1.0",  # CPU使用量を1コアに制限
                    "--pids-limit",
                    "50",  # プロセス数を50に制限
                    "-v",
                    f"{host_abs_work_dir}:/workspace",
                    "-w",
                    "/workspace",
                    JUDGE_IMAGE,
                    "sh",
                    "-c",
                    f"valgrind {valgrind_opts} {exec_compile_cmd}",
                ]
                tc_status = "AC"
                actual_output = ""

                try:
                    exec_proc = subprocess.run(
                        exec_cmd,
                        cwd=abs_work_dir,
                        capture_output=True,
                        text=True,
                        timeout=JUDGE_TIME_LIMIT,
                    )

                    if exec_proc.returncode == 250:
                        tc_status = "ME"
                        actual_output = (
                            f"Memory Error Detected:\n{exec_proc.stderr.strip()}"
                        )
                    elif exec_proc.returncode == -11:
                        tc_status = "RE"
                        actual_output = "Runtime Error: Segmentation fault"
                    elif exec_proc.returncode != 0:
                        tc_status = "RE"
                        actual_output = (
                            f"Runtime Error (returncode: {exec_proc.returncode})"
                        )
                    else:
                        if os.path.exists(output_path):
                            with open(output_path, "r") as f:
                                actual_output = f.read().strip()

                            if actual_output != tc.expected_output.strip():
                                tc_status = "WA"
                        else:
                            tc_status = "RE"

                except subprocess.TimeoutExpired:
                    tc_status = "TLE"
                    subprocess.run(
                        ["docker", "kill", container_name],
                        capture_output=True,
                        check=False,  # すでに終了していた場合のエラーを無視する
                    )

                judge_details[test_name] = {
                    "status": tc_status,
                    "args": args_content,
                    "input": tc.input_file,
                    "expected": tc.expected_output,
                    "output": actual_output,
                }
                submission.details = json.dumps(judge_details, ensure_ascii=False)
                db.commit()

                if tc_status != "AC" and final_status == "AC":
                    final_status = tc_status

        submission.status = final_status
        submission.details = json.dumps(judge_details, ensure_ascii=False)
        db.commit()
        try:
            print("slackを送ろうと思うなり！")
            student = db.query(User).filter(User.student_id == student_id).first()
            problem = db.query(Problem).filter(Problem.problem_id == problem_id).first()

            student_name = student.name
            problem_title = problem.title
            send_slack_notification(student_name, problem_title, final_status)
        except Exception as e:
            print(f"通知準備中にエラーが発生しました:{e}")
    finally:
        db.close()

        abs_work_dir = os.path.abspath(work_dir)
        if os.path.exists(abs_work_dir):
            shutil.rmtree(abs_work_dir, ignore_errors=True)
