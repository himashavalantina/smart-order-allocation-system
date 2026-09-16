"""
ml_classifier.py
~~~~~~~~~~~~~~~~
In-memory scikit-learn text classifier trained from dataset.csv.

Architecture
------------
  - Loads backend/app/ml/dataset.csv on first instantiation.
  - Maps the 8 verbose dataset labels into the 5 canonical output categories
    required by the support ticket system.
  - Uses TfidfVectorizer (bigrams) + LogisticRegression pipeline.
  - predict() returns the mapped category string, or
    "Unclassified - Requires Human Review" when confidence < 65 %.

Required test case (present in dataset.csv row 27):
  "My payment was deducted, but my order is not showing." → "Payment Issue"
"""

import csv
import logging
import os
from typing import Dict, List, Tuple

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Category mapping
# ---------------------------------------------------------------------------
# The dataset uses 8 verbose labels; we collapse them into the 5 canonical
# categories required by the product spec.

LABEL_MAP: Dict[str, str] = {
    "Payment Issue":            "Payment Issue",
    "Delivery Issue":           "Delivery Issue",
    "Refund/Cancellation":      "Refund/Cancellation",
    "Product/Stock Inquiry":    "Product Inquiry",
    "Order Status Inquiry":     "General Inquiry",   # closest match in the 5-category set
    "Account/Login Issue":      "General Inquiry",
    "Promotion/Discount Inquiry": "General Inquiry",
    "General Inquiry":          "General Inquiry",
}

# The 5 canonical output categories
OUTPUT_CATEGORIES = [
    "Payment Issue",
    "Delivery Issue",
    "Refund/Cancellation",
    "Product Inquiry",
    "General Inquiry",
]

# Confidence threshold – below this the result is flagged for human review
CONFIDENCE_THRESHOLD = 0.65
LOW_CONFIDENCE_LABEL = "Unclassified - Requires Human Review"

# Path to the training CSV (sibling of this file's parent package)
_CSV_PATH = os.path.normpath(
    os.path.join(os.path.dirname(__file__), "..", "ml", "dataset.csv")
)


# ---------------------------------------------------------------------------
# Dataset loader
# ---------------------------------------------------------------------------

def _load_dataset() -> Tuple[List[str], List[str]]:
    """
    Read dataset.csv and return (texts, labels).

    - Rows with an empty category are skipped.
    - Dataset labels are mapped through LABEL_MAP to the 5-category set.
    - The required phrase is guaranteed to be present because row 27 of the
      CSV already contains it labelled "Payment Issue".
    """
    texts: List[str] = []
    labels: List[str] = []

    with open(_CSV_PATH, newline="", encoding="utf-8-sig") as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            message = row.get("message", "").strip()
            raw_label = row.get("category", "").strip()
            if not message or not raw_label:
                continue  # skip unlabelled / blank rows
            mapped = LABEL_MAP.get(raw_label)
            if mapped is None:
                logger.debug("Unknown label %r — skipped", raw_label)
                continue
            texts.append(message)
            labels.append(mapped)

    logger.info("Dataset loaded: %d labelled examples from %s", len(texts), _CSV_PATH)
    return texts, labels


# ---------------------------------------------------------------------------
# Classifier
# ---------------------------------------------------------------------------

class MessageClassifier:
    """
    TF-IDF + Logistic Regression pipeline trained in memory from dataset.csv.

    Example
    -------
    >>> clf = MessageClassifier()
    >>> clf.predict("My payment was deducted, but my order is not showing.")
    {'category': 'Payment Issue', 'confidence': 0.87, ...}
    """

    def __init__(self) -> None:
        texts, labels = _load_dataset()

        self._pipeline = Pipeline(
            [
                (
                    "tfidf",
                    TfidfVectorizer(
                        ngram_range=(1, 2),
                        max_features=8000,
                        sublinear_tf=True,
                        min_df=1,
                        strip_accents="unicode",
                        lowercase=True,
                    ),
                ),
                (
                    "clf",
                    LogisticRegression(
                        max_iter=1000,
                        class_weight="balanced",
                        solver="lbfgs",
                        C=4.0,
                    ),
                ),
            ]
        )

        self._pipeline.fit(texts, labels)
        self._classes: List[str] = list(self._pipeline.classes_)
        logger.info(
            "MessageClassifier ready. Classes: %s  |  Threshold: %.0f%%",
            self._classes,
            CONFIDENCE_THRESHOLD * 100,
        )

    def predict(self, text: str) -> Dict:
        """
        Classify *text* into one of the 5 canonical categories.

        Returns
        -------
        {
          "category":          str   — one of OUTPUT_CATEGORIES, or LOW_CONFIDENCE_LABEL,
          "confidence":        float — raw probability 0–1 (e.g. 0.86),
          "confidence_pct":    str   — formatted percentage string (e.g. "86%"),
          "needs_review":      bool  — True when confidence < CONFIDENCE_THRESHOLD,
          "all_probabilities": dict  — {class: probability} for all classes,
        }
        """
        cleaned = text.strip()
        if not cleaned:
            return {
                "category": LOW_CONFIDENCE_LABEL,
                "confidence": 0.0,
                "confidence_pct": "0%",
                "needs_review": True,
                "all_probabilities": {c: 0.0 for c in self._classes},
            }

        proba = self._pipeline.predict_proba([cleaned])[0]
        max_idx = int(proba.argmax())
        max_prob = float(proba[max_idx])
        predicted = self._classes[max_idx]

        needs_review = max_prob < CONFIDENCE_THRESHOLD
        final_category = LOW_CONFIDENCE_LABEL if needs_review else predicted

        all_probs = {
            cls: round(float(p), 4)
            for cls, p in zip(self._classes, proba)
        }

        return {
            "category": final_category,
            "confidence": round(max_prob, 4),
            "confidence_pct": f"{round(max_prob * 100)}%",
            "needs_review": needs_review,
            "all_probabilities": all_probs,
        }


# ---------------------------------------------------------------------------
# Module-level singleton — trained once on first import
# ---------------------------------------------------------------------------

_classifier: MessageClassifier | None = None


def get_classifier() -> MessageClassifier:
    """Return (and lazily initialise) the singleton classifier."""
    global _classifier
    if _classifier is None:
        _classifier = MessageClassifier()
    return _classifier


def classify_message(text: str) -> Dict:
    """
    Convenience function — classifies *text* using the singleton instance.
    Drop-in compatible with existing call-sites in orders.py and support.py.
    """
    return get_classifier().predict(text)
