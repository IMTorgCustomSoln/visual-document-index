#!/usr/bin/env python3
"""
Module Docstring
"""

__author__ = "Jason Beach"
__version__ = "0.1.0"
__license__ = "MIT"


import pandas as pd
import argparse
from pathlib import Path

def main(args):
    """ Main entry point of the app """
    print("hello world")
    print(args)

    input_dir = '../logs/'
    p = Path(input_dir).glob('**/*')
    files_paths = [x for x in p if x.is_file()]
    files = []

    for batch_idx, file in enumerate(files_paths):
        with open(file, 'r') as f:
            while line := f.readline():
                ln = line.rstrip()
                time = int( ln.split(':')[0] )
                file_idx = int( ln.split('file ')[1].split(' -')[0] )
                file_path = ln.split(' underwent')[0].split(' -')[1]
                event = ln.split('event ')[1].split(' with')[0]
                bytes_transferred = int( ln.split(' bytes')[0].split(' with')[1] )


if __name__ == "__main__":
    """ This is executed when run from the command line """
    parser = argparse.ArgumentParser()

    # Required positional argument
    #parser.add_argument("--input_dir", help="input directory")

    # Specify output of "--version"
    parser.add_argument(
        "--version",
        action="version",
        version="%(prog)s (version {version})".format(version=__version__))

    args = parser.parse_args()
    main(args)