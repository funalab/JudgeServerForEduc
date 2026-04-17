# 5. Adding Users

This judge server is designed to be a closed system; only pre-registered users can log in and submit their code. 

## Step 1: Define User Information
You need to register users by adding their data to the following file:
`static_data/users/users.json`

Create or edit the file with the following JSON structure. You will temporarily enter the initial passwords in plaintext.

```json
[
  {
    "id": "yamada",
    "pw": "1111",
    "name": "Taro Yamada"
  },
  {
    "id": "tanaka",
    "pw": "2222",
    "name": "Hanako Tanaka"
  },
  {
    "id": "B4",
    "pw": "3333",
    "name": "Reviewer / Grader"
  }
]
```

**💡 Key Notes on User Roles:**
* **Administrator Privilege:** The user with the exact `id` of `"B4"` is automatically granted special administrator privileges. Only this user can access the grading screens and view the progress of all students.
* **Password Distribution:** The `pw` field represents the initial plaintext password. Please notify each student of their initial password securely *before* proceeding to the next step.


## Step 2: Hash Initial User Passwords
For security reasons, initial passwords must not be stored in plaintext. 
After creating the JSON file, you must hash the passwords using the provided script.

**⚠️ SECURITY WARNINGS:**
* Ensure that `static_data/` is added to your `.gitignore` file. **Never commit** `users.json` to version control, even after hashing.
* The hashing process is irreversible. Make sure you have distributed the initial passwords to the users before running this script.

Run the following commands in your terminal:

```bash
cd backend/others
python hash_password.py
```

Upon execution, the script will read `users.json` and automatically replace all plaintext passwords with **bcrypt-hashed values**. 
Your user data is now secure and ready for the server!

<div align="right">
  Author: Sumire Mori
</div>
