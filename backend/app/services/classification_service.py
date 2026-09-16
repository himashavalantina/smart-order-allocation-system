import logging
from pathlib import Path

import joblib

logger = logging.getLogger(__name__)

MODEL_PATH = Path(__file__).parent.parent / "ml" / "model.pkl"
CONFIDENCE_THRESHOLD = 0.65

# Module-level cache so model is loaded once per process
_model_data: dict | None = None


def _load_model() -> dict:
    global _model_data
    if _model_data is None:
        if not MODEL_PATH.exists():
            raise FileNotFoundError(
                f"ML model not found at {MODEL_PATH}. "
                "Run: cd backend && python app/ml/train.py"
            )
        _model_data = joblib.load(MODEL_PATH)
        logger.info("ML classifier loaded. Classes: %s", _model_data["classes"])
    return _model_data


def classify_message(message: str) -> dict:
    """
    Classify a customer message into one of eight predefined categories:
    Payment Issue | Delivery Issue | Refund/Cancellation |
    Order Status Inquiry | Product/Stock Inquiry |
    Account/Login Issue | Promotion/Discount Inquiry | General Inquiry

    If the highest predicted probability < CONFIDENCE_THRESHOLD (0.65),
    the category is set to "Needs Manual Review" to flag for human handling.

    Returns:
        {
            "category":           str   — predicted or "Needs Manual Review",
            "confidence":         float — max probability (0–1),
            "needs_review":       bool  — True when confidence < threshold,
            "all_probabilities":  dict  — {class_name: probability}
        }
    """
    data = _load_model()
    vectorizer = data["vectorizer"]
    model = data["model"]
    classes: list[str] = data["classes"]

    cleaned = message.strip()
    if not cleaned:
        return {
            "category": "Needs Manual Review",
            "confidence": 0.0,
            "needs_review": True,
            "all_probabilities": {c: 0.0 for c in classes},
        }

    X = vectorizer.transform([cleaned])
    probabilities = model.predict_proba(X)[0]
    max_idx = int(probabilities.argmax())
    max_prob = float(probabilities[max_idx])
    predicted = classes[max_idx]

    needs_review = max_prob < CONFIDENCE_THRESHOLD
    all_probs = {cls: round(float(prob), 4) for cls, prob in zip(classes, probabilities)}

    return {
        "category": predicted if not needs_review else "Needs Manual Review",
        "confidence": round(max_prob, 4),
        "needs_review": needs_review,
        "all_probabilities": all_probs,
    }
