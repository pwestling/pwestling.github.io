from flask import Flask, send_file
import os
import pybktree
import editdistance

cardtree = pybktree.BKTree(editdistance.eval, os.listdir("cards"))

app = Flask(__name__)


@app.route('/<card>')
def return_card(card):
    distance = 0
    results = cardtree.find(card, distance)
    while len(results) == 0:
        distance = distance + 1
        results = cardtree.find(card, distance)
    foundcard: str = "cards/"+results[0][1]
    print(f"Found {foundcard}")
    if foundcard.endswith("jpg"):
        return send_file(foundcard, mimetype='image/jpg')
    else:
        return send_file(foundcard, mimetype='image/png')
