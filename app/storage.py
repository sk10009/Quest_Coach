import json
import os
import tempfile
import threading
from typing import Any, Dict, Optional
import httpx

_FILE_LOCKS: Dict[str, threading.Lock] = {}
_META_LOCK = threading.Lock()

def _get_lock(path: str) -> threading.Lock:
    with _META_LOCK:
        if path not in _FILE_LOCKS:
            _FILE_LOCKS[path] = threading.Lock()
        return _FILE_LOCKS[path]

class AtomicJsonStore:
    """
    Atomic JSON Storage Repository (Zero SQLite / Zero SQL).
    - Local: thread-safe, atomic tempfile write + os.replace.
    - Serverless (VERCEL=1): reads/writes to REMOTE_JSON_STORE_URL or Vercel Blob adapter via HTTPS JSON endpoint.
    """
    def __init__(self, file_path: str):
        self.file_path = os.path.abspath(file_path)
        self.is_vercel = os.environ.get("VERCEL") == "1"
        self.remote_url = os.environ.get("REMOTE_JSON_STORE_URL")
        self.blob_token = os.environ.get("BLOB_READ_WRITE_TOKEN")
        self._filename = os.path.basename(self.file_path)

    def read(self, default: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        if default is None:
            default = {}

        if self.is_vercel and self.remote_url:
            try:
                target_url = f"{self.remote_url.rstrip('/')}/{self._filename}"
                headers = {}
                if self.blob_token:
                    headers["Authorization"] = f"Bearer {self.blob_token}"
                resp = httpx.get(target_url, headers=headers, timeout=10.0)
                if resp.status_code == 200:
                    return resp.json()
            except Exception as e:
                print(f"[AtomicJsonStore] Remote read failed for {self._filename}: {e}")

        lock = _get_lock(self.file_path)
        with lock:
            if not os.path.exists(self.file_path):
                self._write_local_atomic(default)
                return default
            try:
                with open(self.file_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                print(f"[AtomicJsonStore] Local read error {self.file_path}: {e}")
                return default

    def write(self, data: Dict[str, Any]) -> None:
        if self.is_vercel and self.remote_url:
            try:
                target_url = f"{self.remote_url.rstrip('/')}/{self._filename}"
                headers = {"Content-Type": "application/json"}
                if self.blob_token:
                    headers["Authorization"] = f"Bearer {self.blob_token}"
                httpx.put(target_url, headers=headers, json=data, timeout=10.0)
            except Exception as e:
                print(f"[AtomicJsonStore] Remote write failed for {self._filename}: {e}")

        lock = _get_lock(self.file_path)
        with lock:
            self._write_local_atomic(data)

    def _write_local_atomic(self, data: Dict[str, Any]) -> None:
        dir_name = os.path.dirname(self.file_path)
        if dir_name and not os.path.exists(dir_name):
            os.makedirs(dir_name, exist_ok=True)

        temp_fd, temp_path = tempfile.mkstemp(
            dir=dir_name, prefix=".tmp_", suffix=".json"
        )
        try:
            with os.fdopen(temp_fd, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            os.replace(temp_path, self.file_path)
        except Exception:
            if os.path.exists(temp_path):
                try:
                    os.remove(temp_path)
                except Exception:
                    pass
            raise

KB_STORE = AtomicJsonStore(os.path.join("data", "knowledge_base.json"))
USER_STORE = AtomicJsonStore(os.path.join("data", "user_state.json"))
