"""Parse processed HTML output for mismatch annotations.

The n8n workflow produces HTML with mismatch markers using specific
CSS classes and data attributes. This module extracts those markers
and returns structured mismatch data for the review system.

Expected HTML format from n8n:
  <span class="mismatch"
        data-mismatch-id="mismatch-1"
        data-original="Mr."
        data-suggested="Mrs."
        data-field="Salutation"
        data-confidence="0.85">
    Mrs.
  </span>
"""
import logging
import re
from dataclasses import dataclass
from typing import Optional

logger = logging.getLogger(__name__)


@dataclass
class MismatchData:
    """Structured representation of a single mismatch from HTML."""

    mismatch_id: str
    original_text: str
    suggested_text: str
    field_label: str
    confidence_score: Optional[float]


# Regex pattern to extract mismatch spans from HTML
MISMATCH_PATTERN = re.compile(
    r'<span[^>]*class="[^"]*mismatch[^"]*"'
    r'[^>]*data-mismatch-id="(?P<id>[^"]*)"'
    r'[^>]*data-original="(?P<original>[^"]*)"'
    r'[^>]*data-suggested="(?P<suggested>[^"]*)"'
    r'(?:[^>]*data-field="(?P<field>[^"]*)")?'
    r'(?:[^>]*data-confidence="(?P<confidence>[^"]*)")?'
    r'[^>]*>',
    re.DOTALL | re.IGNORECASE,
)

# Fallback: also try JSON-LD style mismatch blocks
MISMATCH_JSON_PATTERN = re.compile(
    r'<!--\s*MISMATCH:\s*({[^}]+})\s*-->',
    re.DOTALL,
)


def parse_mismatches_from_html(html_content: str) -> list[MismatchData]:
    """Extract mismatch annotations from processed HTML.

    Args:
        html_content: The HTML string output from n8n processing.

    Returns:
        List of MismatchData objects found in the HTML.
    """
    mismatches: list[MismatchData] = []

    # Try span-based markers first
    for match in MISMATCH_PATTERN.finditer(html_content):
        confidence_str = match.group('confidence')
        confidence = None
        if confidence_str:
            try:
                confidence = float(confidence_str)
            except ValueError:
                pass

        mismatches.append(MismatchData(
            mismatch_id=match.group('id'),
            original_text=match.group('original'),
            suggested_text=match.group('suggested'),
            field_label=match.group('field') or '',
            confidence_score=confidence,
        ))

    if mismatches:
        logger.info("Parsed %d mismatches from HTML (span markers)", len(mismatches))
        return mismatches

    # Fallback: try JSON comment markers
    import json
    for match in MISMATCH_JSON_PATTERN.finditer(html_content):
        try:
            data = json.loads(match.group(1))
            confidence = data.get('confidence')
            if confidence is not None:
                try:
                    confidence = float(confidence)
                except (ValueError, TypeError):
                    confidence = None

            mismatches.append(MismatchData(
                mismatch_id=data.get('id', f'mismatch-{len(mismatches) + 1}'),
                original_text=data.get('original', ''),
                suggested_text=data.get('suggested', ''),
                field_label=data.get('field', ''),
                confidence_score=confidence,
            ))
        except (json.JSONDecodeError, KeyError):
            logger.warning("Failed to parse mismatch JSON comment: %s", match.group(0)[:100])

    if mismatches:
        logger.info("Parsed %d mismatches from HTML (JSON comments)", len(mismatches))
    else:
        logger.info("No mismatches found in HTML content (%d chars)", len(html_content))

    return mismatches
