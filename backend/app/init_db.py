from app.config import (
    Base,
    SessionLocal,
    engine,
    User,
    Problem,
    TestCase,
    Submission,
    get_password_hash,
)
import json
import os

def init_db():
    Base.metadata.create_all(bind=engine)
    print("--- テーブルの作成完了 ---")

    session = SessionLocal()

    # --- 初期データの投入 --
    # 1. パスの設定 
    base_dir = "/app/static_data"
    users_dir = os.path.join(base_dir, "users")
    problems_dir = os.path.join(base_dir, "problems")
    testcases_dir = os.path.join(base_dir, "testcases")

    u_json_path = os.path.join(users_dir, "users.json")

    if os.path.exists(u_json_path):
        with open(u_json_path, "r", encoding="utf-8") as f:
            users_data = json.load(f)

    for u in users_data:
        user = User(
            student_id=u["id"],
            name=u["name"],
            password_hash=u["pw"],  # ハッシュ化して保存
        )
        session.merge(user)

    print("User情報を読み込みました。")
    print()

    tc_id_counter = 1

    # 2. problemsのjsonが入ったディレクトリを探し、問題ごとに別れた各ディレクトリからproblem.jsonを読み込む
    if os.path.exists(problems_dir):
        for p_id in sorted(os.listdir(problems_dir)):
            p_folder = os.path.join(problems_dir, p_id)

            # .DSStore等の隠しファイルはスキップし、フォルダのみ処理
            if not os.path.isdir(p_folder):
                continue

            # --- Problemを登録 --- #
            p_json_path = os.path.join(p_folder, "problem.json")
            if os.path.exists(p_json_path):
                with open(p_json_path, "r", encoding="utf-8") as f:
                    data = json.load(f)

                problem = Problem(
                    problem_id=p_id,  # フォルダ名をproblem_idとする
                    title=data.get("title", f"{p_id} (No Title)"),
                    description=data.get("description", ""),
                    deadline=data.get("deadline", ""),
                    release_date=data.get("release_date", ""),
                    criterion=data.get("criterion", ""),
                    time_limit=data.get("time_limit", 4.0),  # デフォルト4秒
                    memory_limit=data.get("memory_limit", 256),  # デフォルト256MB
                )
                session.merge(problem)
                print(f"[Problem] {p_id}のjsonファイルを読み込みました")

            # --- TestCase の登録 (tcは1つのproblemに対して複数ある) --- #
            tc_folder = os.path.join(testcases_dir, p_id)
            loaded_tc_count = 0  # 読み込んだテストケースの数を計上
            tc_num = 0

            if os.path.exists(tc_folder):
                subdirs = [
                    d
                    for d in os.listdir(tc_folder)
                    if os.path.isdir(os.path.join(tc_folder, d))
                ]

                try:
                    tc_subdirs = sorted(subdirs, key=int)

                except ValueError:
                    tc_subdirs = sorted(subdirs)

                # 1つ1つのテストケースが入ったsubdirs 1, 2, ... と
                for tc_num in tc_subdirs:
                    sub_folder = os.path.join(tc_folder, tc_num)
                    in_path = os.path.join(sub_folder, "input.txt")
                    out_path = os.path.join(sub_folder, "output.txt")
                    args_path = os.path.join(sub_folder, "args.txt")

                    if p_id == "C11":
                        exclude_files = ["output.txt", "args.txt"]
                        other_files = [
                            f
                            for f in os.listdir(sub_folder)
                            if os.path.isfile(os.path.join(sub_folder, f))
                            and f not in exclude_files
                        ]
                        if other_files:
                            in_path = os.path.join(sub_folder, other_files[0])
                        else:
                            in_path = ""
                    input_val = "dummy.txt"
                    expected_val = "working"
                    args_val = None

                    if os.path.exists(in_path):
                        with open(in_path, "r", encoding="utf-8") as f:
                            input_val = f.read()

                    if os.path.exists(out_path):
                        with open(out_path, "r", encoding="utf-8") as f:
                            expected_val = f.read()
                    if os.path.exists(args_path):
                        with open(args_path, "r", encoding="utf-8") as f:
                            args_val = f.read()
                    loaded_tc_count += 1

                    # データベースへの登録(.mergeは、同じidがあれば自動で「更新」、なければ「追加」していく)
                    new_tc = TestCase(
                        id=tc_id_counter,
                        problem_id=p_id,
                        input_file=input_val,
                        expected_output=expected_val,
                        args_file=args_val,
                    )
                    session.merge(new_tc)
                    tc_id_counter += 1

            print(
                f" └[TestCase] {p_id}のテストケースを {loaded_tc_count}件読み込みました。"
            )
            print()

    session.commit()
    session.close()

    print(
        "データベースを初期化しました: ユーザー、問題およびテストケースを作成完了"
    )


if __name__ == "__main__":
    init_db()
