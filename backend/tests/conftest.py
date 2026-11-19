"""Pytest configuration and test environment setup."""

import os

# Set testing environment flags before any application imports occur
os.environ["TESTING"] = "1"
os.environ["DATABASE_URL"] = "mock"
os.environ["GITHUB_TOKEN"] = "mock_token"
os.environ["E2B_API_KEY"] = "mock_e2b"
