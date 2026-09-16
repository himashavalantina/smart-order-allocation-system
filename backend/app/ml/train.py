"""
ML Training Script
==================
Trains a TF-IDF + Logistic Regression classifier on dataset.csv and saves
the model artefact to model.pkl.

The dataset has columns: id, message, category
Rows with empty message or empty category are dropped automatically.

Usage (from the backend directory):
    python app/ml/train.py
"""

import sys
from pathlib import Path

# Ensure UTF-8 output even on Windows terminals
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split

DATA_PATH = Path(__file__).parent / "dataset.csv"
MODEL_PATH = Path(__file__).parent / "model.pkl"


def train() -> None:
    # ── Load data ─────────────────────────────────────────────────────────────
    df = pd.read_csv(DATA_PATH)

    # The dataset has: id, message, category columns
    if "id" in df.columns:
        df = df.drop(columns=["id"])

    # Drop rows where message OR category is missing/empty
    df = df.dropna(subset=["message", "category"])
    df = df[df["message"].str.strip() != ""]
    df = df[df["category"].str.strip() != ""]
    df["message"] = df["message"].str.strip()
    df["category"] = df["category"].str.strip()

    print(f"\n[INFO] Dataset after cleaning: {len(df)} examples")
    print(df["category"].value_counts().to_string())
    print()

    if len(df) < 10:
        raise ValueError("Not enough labeled rows in dataset.csv to train a classifier.")

    X, y = df["message"], df["category"]

    # Use stratify only if every class has >= 2 samples
    class_counts = y.value_counts()
    can_stratify = (class_counts >= 2).all()

    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=0.20,
        random_state=42,
        stratify=y if can_stratify else None,
    )

    print(f"[INFO] Train size: {len(X_train)} | Test size: {len(X_test)}")

    # ── Vectorise ─────────────────────────────────────────────────────────────
    vectorizer = TfidfVectorizer(
        max_features=8000,
        ngram_range=(1, 2),
        stop_words="english",
        min_df=1,
        sublinear_tf=True,
        strip_accents="unicode",
    )
    X_train_vec = vectorizer.fit_transform(X_train)
    X_test_vec = vectorizer.transform(X_test)

    # ── Train ─────────────────────────────────────────────────────────────────
    model = LogisticRegression(
        C=2.0,
        max_iter=2000,
        random_state=42,
        class_weight="balanced",
        solver="lbfgs",
    )
    model.fit(X_train_vec, y_train)

    # ── Evaluate ──────────────────────────────────────────────────────────────
    y_pred = model.predict(X_test_vec)
    acc = accuracy_score(y_test, y_pred)
    print(f"\n[RESULT] Test accuracy: {acc:.2%}\n")
    print(classification_report(y_test, y_pred))

    # ── Save ──────────────────────────────────────────────────────────────────
    joblib.dump(
        {
            "vectorizer": vectorizer,
            "model": model,
            "classes": list(model.classes_),
        },
        MODEL_PATH,
    )
    print(f"[SAVED] Model saved -> {MODEL_PATH}")
    print(f"[INFO]  Categories: {list(model.classes_)}")


if __name__ == "__main__":
    train()
