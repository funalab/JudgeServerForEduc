import json
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

json_path = "../../static_data/users/users.json"

with open(json_path, "r", encoding="utf-8") as f:
    users = json.load(f)

for user in users:
    if not user["pw"].startswith("$"):
        user["pw"] = get_password_hash(user["pw"])

with open(json_path, "w", encoding="utf-8") as f:
    json.dump(users, f, indent=2, ensure_ascii=False)

print("users.jsonのパスワードをハッシュ化しました。")