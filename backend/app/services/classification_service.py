"""
classification_service.py
~~~~~~~~~~~~~~~~~~~~~~~~~
Backwards-compatible shim that delegates to the new in-memory
MessageClassifier in ml_classifier.py.

All existing call-sites (orders router, classify router) continue to work
unchanged.
"""

from app.services.ml_classifier import classify_message  # noqa: F401 — re-export

__all__ = ["classify_message"]
