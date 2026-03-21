"""One-time script to clean up orphan processed file references in Supabase."""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
sys.path.insert(0, os.path.dirname(__file__))
django.setup()

from apps.documents.models import Document, DocumentStatusHistory
from utils.storage import get_storage_backend

storage = get_storage_backend()
doc = Document.objects.get(id=50)

print(f"Document {doc.id}: {doc.name} (status={doc.status})")

paths_to_delete = [
    ("processed_html_path", doc.processed_html_path),
    ("processed_report_path", doc.processed_report_path),
    ("processed_json_path", doc.processed_json_path),
    ("html_v2_path", doc.html_v2_path),
    ("txt_v2_path", doc.txt_v2_path),
    ("corrections_log_path", doc.corrections_log_path),
]

for field, path in paths_to_delete:
    if path:
        try:
            storage.delete(path)
            print(f"  Deleted from storage: {field} -> {path}")
        except Exception as e:
            print(f"  Failed to delete {field} ({path}): {e}")

doc.processed_html_path = None
doc.processed_report_path = None
doc.processed_json_path = None
doc.html_v2_path = None
doc.txt_v2_path = None
doc.corrections_log_path = None
doc.status = "in_progress"
doc.save()

DocumentStatusHistory.objects.create(
    document=doc,
    from_status="processed",
    to_status="in_progress",
    changed_by=None,
    notes="Cleanup: cleared orphan processed file references for re-processing",
)

print(f"\nDone. Document {doc.id} cleared and reset to in_progress.")
