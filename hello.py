"""A tiny hello-world popup.

Run it and a message box saying "hello" appears.
Requires Python 3 with tkinter (bundled with standard CPython installers
on Windows/macOS; on Linux install python3-tk first).
"""

import tkinter as tk
from tkinter import messagebox


def main():
    root = tk.Tk()
    root.withdraw()  # hide the empty root window, show only the popup
    messagebox.showinfo("Hello", "hello")
    root.destroy()


if __name__ == "__main__":
    main()
