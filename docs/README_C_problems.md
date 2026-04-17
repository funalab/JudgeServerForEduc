# C Programming Assignments

This document lists the C programming assignments available on this judge server. 



## [C0] Introduction
### C0_test: Hello World
Create a program `hello.c` that outputs "Hello World!".



## [C1] Standard I/O and Character Operations
### C1: Character Case Conversion
Create a program that reads characters from the keyboard (standard input). If the character is a letter, perform the following operation: convert uppercase letters to lowercase, and lowercase letters to uppercase. This input process should repeat until EOF (Ctrl + D) is received.



## [C2] Loops and Basic Math
### C2_1: mycat
Implement a program `mycat.c` that reads strings from standard input and prints them to standard output until EOF (Ctrl + D) is received.

### C2_2: Average and Sum
Implement a program `average.c` that reads numerical values from standard input until EOF is received, and prints their sum and average to standard output.



## [C3] Mathematical Modeling
### C3_1: E. coli Growth Model
Simulate the growth model of *E. coli* using the Euler method. (The mathematical model details are omitted).

### C3_2: Infection Model
Simulate an infectious disease model using the Runge-Kutta method. (The mathematical model details are omitted).



## [C5] Algorithms (Basics)
### C5: Greatest Common Divisor
Implement a program `gcd.c` that outputs the greatest common divisor (GCD) of two positive integers given via standard input.



## [C6] String Basics
### C6_1: mystrlen (Standard Input)
Implement a program `main_mystrlen.c` containing a `main` function that prints the length of a string provided via standard input.

### C6_2: mystrlen2 (Command-line Arguments)
Implement a program `main_mystrlen2.c` containing a `main` function that prints the length of a string given as a command-line argument.



## [C7] String Manipulation
### C7_1: mystrcpy
Create a program `main_mystrcpy.c` containing a `main` function that copies a string given via standard input and prints it to standard output.

### C7_2: mystrncpy
Create and execute a program `main_mystrncpy.c` containing a `main` function that copies up to the n-th character of a string given via standard input and prints it to standard output.

### C7_3: mystrcmp
Create and execute a program `main_mystrcmp.c` containing a `main` function that compares two strings given via standard input and prints the result.

### C7_4: mystrncmp
Create and execute a program `main_mystrncmp.c` containing a `main` function that compares two strings given via standard input up to the n-th character and prints the result.



## [C8] Structs and Sorting
### C8_1: SortStruct
Create and execute a program `main_SortStruct.c` containing a `main` function that sorts player information given via standard input by age, and prints it to standard output.
* **Notes:** It is recommended to use the `mystr` functions created in previous assignments. Be careful of memory leaks (do not forget to use `free()`). Submit the source code (including any header files you created).

### C8_2: DictStruct
Create and execute a program `main_DictStruct.c` containing a `main` function that sorts strings given as command-line arguments in lexicographical (dictionary) order and prints them to standard output.



## [C10] File I/O and Advanced Strings
### C10_1: File Sorting
Create and execute a program `file.c` containing a `main` function that reads a group of words from a file, sorts them in lexicographical order, and outputs the result to another file.

### C10_2: String Substitution
Implement a program `main_mystrsubst.c` containing a `main` function that generates and outputs a new string `new_str` using three strings `s1`, `s2`, and `s3` provided via standard input.



## [C11] Summary Project
### C11: PJT
This assignment is to develop a Command Line Interface (CLI) tool written in C that builds, manipulates, and analyzes Binary Search Trees (BST) from text inputs. This project is designed to demonstrate your understanding of dynamic memory management, pointer manipulation, and fundamental data structure operations in C.



## [C12] Bioinformatics Algorithms: DNA Sequence Optimization
This group of problems is structured conceptually in the order of "Exhaustive Search -> Greedy Algorithm -> Beam Search". However, in terms of implementation simplicity, the order is "Greedy Algorithm < Exhaustive Search < Beam Search". If you are unsure where to start, we highly recommend starting with the Greedy Algorithm (C12_2).

### C12_0: DNA Sequence Comparison
As a member of the Department of Bioinformatics, you are tasked with creating a program to compare the performance of two DNA sequences.

### C12_1: DNA Synthesis (Exhaustive Search)
You are developing a program to synthesize DNA sequences (strings consisting of 'A', 'C', 'G', 'T').
Find and output the string that yields the **maximum** total score among all possible DNA sequences of length `N`, based on the [Score Calculation Rules] (same as C12_0). The execution time will be sufficient even if you search all possibilities, so please implement an Exhaustive Search (Brute Force).

### C12_2: DNA Synthesis (Greedy Algorithm)
Since Exhaustive Search takes too long for larger sequences, generate a string of length `N` following the **[Greedy Algorithm]** .

### C12_3: DNA Synthesis (Beam Search)
Because the Greedy Algorithm can fall into local optima, you decided to implement a more advanced search method: **Beam Search**. Generate a string of length `N` following the algorithm below.

<div align="right">
  Author: Sumire Mori
</div>