# 6. Adding New Problems and Test Cases

This judge server is specifically designed for grading educational assignments for beginners learning the C language. 
[While it comes pre-packaged with approximately 10 built-in problems](./README_C_problems.md), you can easily expand the curriculum by adding your own custom problems.

Follow the steps below to add a new problem to the system.

## Step 1: Create Problem and Test Case Directories
Choose a unique ID for your new problem (e.g., `C0_test`, `C11`). You must create a folder with this exact same name in **both** the `problems` and `testcases` directories.

```bash
mkdir static_data/problems/C0_test
mkdir static_data/testcases/C0_test
```

## Step 2: Define Problem Details (JSON)
Inside your newly created problem directory, create a configuration file named `problem.json`.
Path example: `static_data/problems/C0_test/problem.json`

Define the problem specifications using the following JSON format:

```json
{
  "title": "Hello World!",
  "description": "Hello World!と出力するプログラム hello.c を作成してください。",
  "deadline": "2026/03/30 23:59",
  "release_date": "2026/03/04 00:00",
  "criterion": "採点基準です。担当の人は採点基準を書いてください"
}
```

**💡 Configuration Notes:**
* **Date Format**: Both `deadline` and `release_date` must strictly follow the YYYY/MM/DD HH:MM format.
* **Criterion**: This field is a guideline for the teachers (graders). Please clearly state the grading rubrics or specific points they should verify during manual code reviews.


## Step 3: Add Test Cases
Next, navigate to your corresponding test cases directory.
Path example: `static_data/testcases/C0_test/`

You must create numbered subdirectories for each test case. 
Inside each numbered folder, place an `input.txt` and an `output.txt` file.

```bash
# Test Case 1
mkdir 1
touch 1/input.txt   # Write the standard input data here
touch 1/output.txt  # Write the expected standard output here

# Test Case 2
mkdir 2
touch 2/input.txt   # Write the standard input data for test 2
touch 2/output.txt  # Write the expected standard output for test 2
```

**💡 Test Case Notes:**
* **Directory Naming**: The subdirectories **must be named with integers only** (`1`, `2`, `3`, etc.). The judge system reads these folders sequentially. Do not use names like `test1` or `case_1`.
* **Empty Inputs**: If a problem does not require any standard input (such as the "Hello World!" example), simply leave the `input.txt` file completely empty. However, the empty file itself must exist to prevent file-not-found errors during the judging process.

<div align="right">
  Author: Sumire Mori
</div>