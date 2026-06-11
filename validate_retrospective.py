"""
Retrospective validation harness for AlphaNexus invalidation module.

Uses VALIDATION_SET (~30 labeled rows) from app/fixtures.py.
All inputs use pre-trial signals only (trial_history=None throughout).

# LOOKAHEAD RISK: forward_citations_pct in the validation set uses
#   post-grant citation counts (available after grant, before trial).
#   For strictly pre-grant scoring, citations would also be unavailable.
#   Here we treat post-grant / pre-trial as the prediction horizon.

Computes:
    AUC-ROC (trapezoidal, sklearn if available else manual implementation)
    Precision @ 0.5 threshold
    Recall @ 0.5 threshold
    F1 @ 0.5 threshold

Usage:
    python validate_retrospective.py
"""

import logging
import sys
from pathlib import Path

# Ensure project root is on path when run directly
sys.path.insert(0, str(Path(__file__).parent))

from app.fixtures import VALIDATION_SET
from app.modules import invalidation_module

logging.basicConfig(level=logging.WARNING, format="%(levelname)s %(message)s")
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# AUC implementation — sklearn preferred, trapezoidal fallback
# ---------------------------------------------------------------------------

def _auc_trapezoidal(y_true: list[int], y_scores: list[float]) -> float:
    """
    Manual AUC-ROC via trapezoidal rule over sorted thresholds.

    Args:
        y_true: Binary labels (0 or 1).
        y_scores: Predicted probability / score (higher = more likely positive).

    Returns:
        AUC value in [0, 1].
    """
    # Sort by descending score
    paired = sorted(zip(y_scores, y_true), key=lambda t: -t[0])

    total_pos = sum(y_true)
    total_neg = len(y_true) - total_pos

    if total_pos == 0 or total_neg == 0:
        raise ValueError("AUC requires at least one positive and one negative sample")

    tpr_points: list[float] = [0.0]
    fpr_points: list[float] = [0.0]

    tp = 0
    fp = 0

    for score, label in paired:
        if label == 1:
            tp += 1
        else:
            fp += 1
        tpr_points.append(tp / total_pos)
        fpr_points.append(fp / total_neg)

    # Trapezoidal integration
    auc = 0.0
    for i in range(1, len(fpr_points)):
        d_fpr = fpr_points[i] - fpr_points[i - 1]
        avg_tpr = (tpr_points[i] + tpr_points[i - 1]) / 2.0
        auc += d_fpr * avg_tpr

    return auc


def compute_auc(y_true: list[int], y_scores: list[float]) -> float:
    """Compute AUC — use sklearn if available for robustness, else fallback."""
    try:
        from sklearn.metrics import roc_auc_score  # type: ignore[import]
        return float(roc_auc_score(y_true, y_scores))
    except ImportError:
        logger.info("sklearn not found — using manual trapezoidal AUC")
        return _auc_trapezoidal(y_true, y_scores)


def compute_precision_recall_f1(
    y_true: list[int],
    y_pred: list[int],
) -> tuple[float, float, float]:
    """
    Compute precision, recall, F1 at binary predictions.

    Returns:
        (precision, recall, f1) — all in [0, 1].
    """
    tp = sum(1 for t, p in zip(y_true, y_pred) if t == 1 and p == 1)
    fp = sum(1 for t, p in zip(y_true, y_pred) if t == 0 and p == 1)
    fn = sum(1 for t, p in zip(y_true, y_pred) if t == 1 and p == 0)

    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    f1 = (
        2 * precision * recall / (precision + recall)
        if (precision + recall) > 0
        else 0.0
    )
    return precision, recall, f1


# ---------------------------------------------------------------------------
# Main validation run
# ---------------------------------------------------------------------------

def main() -> None:
    """Run retrospective validation and print results to stdout."""
    print("=" * 60)
    print("AlphaNexus — Retrospective Invalidation Module Validation")
    print("=" * 60)
    print(f"Validation set size: {len(VALIDATION_SET)} records")

    labels: list[int] = []
    scores: list[float] = []

    for i, record in enumerate(VALIDATION_SET):
        label = int(record["invalidated"])

        # Strip the ground-truth label before scoring
        patent_record = {k: v for k, v in record.items() if k != "invalidated"}

        result = invalidation_module(patent_record)
        score = result["score"]

        labels.append(label)
        scores.append(score)

        logger.debug(
            "Row %d: label=%d score=%.2f completeness=%.2f",
            i, label, score, result["completeness"],
        )

    # --- AUC-ROC ---
    auc = compute_auc(labels, scores)

    # --- Precision / Recall / F1 at threshold 20.0 ---
    # Threshold set at 20.0 (between upheld mean ~7 and invalidated mean ~31).
    # Invalidation scores are anchored to a ~10% population base-rate (baseline=-2.2),
    # so even high-risk patents score in the 20–50 range on these fixtures.
    THRESHOLD: float = 20.0
    preds = [1 if s >= THRESHOLD else 0 for s in scores]
    precision, recall, f1 = compute_precision_recall_f1(labels, preds)

    # --- Print results ---
    pos_count = sum(labels)
    neg_count = len(labels) - pos_count

    print(f"\nClass distribution: {pos_count} invalidated, {neg_count} upheld")
    print(f"\nScore distribution:")
    inv_scores = [s for s, l in zip(scores, labels) if l == 1]
    upheld_scores = [s for s, l in zip(scores, labels) if l == 0]
    print(f"  Invalidated  mean={sum(inv_scores)/len(inv_scores):.1f}  "
          f"min={min(inv_scores):.1f}  max={max(inv_scores):.1f}")
    print(f"  Upheld       mean={sum(upheld_scores)/len(upheld_scores):.1f}  "
          f"min={min(upheld_scores):.1f}  max={max(upheld_scores):.1f}")

    print(f"\n--- Results (threshold={THRESHOLD:.0f}) ---")
    print(f"AUC-ROC:               {auc:.4f}")
    print(f"Precision @{THRESHOLD:.0f}:     {precision:.4f}")
    print(f"Recall    @{THRESHOLD:.0f}:     {recall:.4f}")
    print(f"F1        @{THRESHOLD:.0f}:     {f1:.4f}")
    print(f"\nBasis: Harhoff, Scherer & Vopel (2003); KR IPR base-rate ~10%")
    print(
        "Note: AUC measures rank-ordering ability of the invalidation score."
        "\n      Calibration against a real KR trial dataset is required before"
        "\n      production use. These fixtures are synthetic/illustrative."
    )
    print("=" * 60)


if __name__ == "__main__":
    main()
