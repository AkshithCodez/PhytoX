import os
os.environ['DATABASE_URL'] = 'sqlite://'
os.environ['PYTHONDONTWRITEBYTECODE'] = '1'
import unittest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from backend.app.main import app
from backend.app.db import Base, get_db


class UnifiedRoutingIntegration(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine('sqlite://', connect_args={'check_same_thread': False}, poolclass=StaticPool)
        Base.metadata.create_all(self.engine)
        session = sessionmaker(bind=self.engine)
        def isolated_db():
            with session() as db:
                yield db
        app.dependency_overrides[get_db] = isolated_db
        self.client = TestClient(app)

    def tearDown(self):
        app.dependency_overrides.clear()
        self.engine.dispose()

    def test_clean_routes_serve_correct_content(self):
        # 1. Landing page
        res = self.client.get('/')
        self.assertEqual(res.status_code, 200)
        self.assertIn('KrishRakshak', res.text)
        self.assertIn('id="root"', res.text)

        # 2. Login page
        res = self.client.get('/login')
        self.assertEqual(res.status_code, 200)
        self.assertIn('Sign In to KrishiRakshak', res.text)
        self.assertIn('tabOfficer', res.text)

        # 3. Farmer routes
        for url in ['/farmer', '/farmer/predict', '/farmer/history', '/farmer/community', '/farmer/nearby']:
            with self.subTest(url=url):
                res = self.client.get(url)
                self.assertEqual(res.status_code, 200)
                self.assertIn('Farmer Portal', res.text)
                self.assertIn('Diagnose Crop', res.text)

        # 4. Officer routes
        for url in ['/officer', '/officer/reports', '/officer/map', '/officer/analytics']:
            with self.subTest(url=url):
                res = self.client.get(url)
                self.assertEqual(res.status_code, 200)
                self.assertIn('id="map"', res.text)
                self.assertIn('reportsTableSection', res.text)

    def test_custom_404_page(self):
        res = self.client.get('/nonexistent-path-abc-123')
        self.assertEqual(res.status_code, 404)
        self.assertIn('Uncharted Field', res.text)
        self.assertIn('404 &bull; PATH NOT FOUND', res.text)

    def test_officer_login_endpoint(self):
        # Valid login with demo passkey
        valid_res = self.client.post('/api/auth/officer/login', json={
            'officer_id': 'OFFICER-AP-01',
            'password': 'krishi2026'
        })
        self.assertEqual(valid_res.status_code, 200)
        body = valid_res.json()
        self.assertTrue(body['authenticated'])
        self.assertEqual(body['role'], 'agricultural_officer')
        self.assertTrue(body['token'].startswith('krishi_officer_token_'))

        # Invalid login
        invalid_res = self.client.post('/api/auth/officer/login', json={
            'officer_id': 'OFFICER-AP-01',
            'password': 'wrong'
        })
        self.assertEqual(invalid_res.status_code, 200)
        self.assertFalse(invalid_res.json()['authenticated'])


if __name__ == '__main__':
    unittest.main()
