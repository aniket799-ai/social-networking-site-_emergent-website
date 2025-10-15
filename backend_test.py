import requests
import sys
import json
from datetime import datetime

class ProfNetworkAPITester:
    def __init__(self, base_url="https://profnetwork-4.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.test_user_data = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "status": "PASSED" if success else "FAILED",
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}, Expected: {expected_status}"
            
            if not success:
                try:
                    error_data = response.json()
                    details += f", Response: {error_data}"
                except:
                    details += f", Response: {response.text[:200]}"
            
            self.log_test(name, success, details)
            
            if success:
                try:
                    return response.json()
                except:
                    return {}
            return None

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return None

    def test_user_registration(self):
        """Test user registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        self.test_user_data = {
            "username": f"testuser_{timestamp}",
            "email": f"test_{timestamp}@example.com",
            "password": "TestPass123!",
            "full_name": "Test User",
            "profession": "Engineer",
            "bio": "Test bio for automated testing",
            "location": "Test City"
        }
        
        response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=self.test_user_data
        )
        
        if response and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            return True
        return False

    def test_user_login(self):
        """Test user login"""
        if not self.test_user_data:
            return False
            
        login_data = {
            "email": self.test_user_data["email"],
            "password": self.test_user_data["password"]
        }
        
        response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        if response and 'token' in response:
            self.token = response['token']
            return True
        return False

    def test_get_current_user(self):
        """Test get current user"""
        response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        return response is not None

    def test_dashboard_stats(self):
        """Test dashboard stats"""
        response = self.run_test(
            "Dashboard Stats",
            "GET",
            "dashboard/stats",
            200
        )
        return response is not None

    def test_create_post(self):
        """Test creating a post"""
        post_data = {
            "content": "This is a test post from automated testing"
        }
        
        response = self.run_test(
            "Create Post",
            "POST",
            "posts",
            200,
            data=post_data
        )
        
        if response and 'id' in response:
            self.test_post_id = response['id']
            return True
        return False

    def test_get_posts(self):
        """Test getting posts"""
        response = self.run_test(
            "Get Posts",
            "GET",
            "posts",
            200
        )
        return response is not None

    def test_like_post(self):
        """Test liking a post"""
        if not hasattr(self, 'test_post_id'):
            return False
            
        response = self.run_test(
            "Like Post",
            "POST",
            f"posts/{self.test_post_id}/like",
            200
        )
        return response is not None

    def test_comment_on_post(self):
        """Test commenting on a post"""
        if not hasattr(self, 'test_post_id'):
            return False
            
        comment_data = {
            "content": "This is a test comment"
        }
        
        response = self.run_test(
            "Comment on Post",
            "POST",
            f"posts/{self.test_post_id}/comment",
            200,
            data=comment_data
        )
        return response is not None

    def test_get_users(self):
        """Test getting users for discovery"""
        response = self.run_test(
            "Get Users (Discover)",
            "GET",
            "users",
            200
        )
        return response is not None

    def test_get_users_with_filter(self):
        """Test getting users with profession filter"""
        response = self.run_test(
            "Get Users with Filter",
            "GET",
            "users?profession=Engineer",
            200
        )
        return response is not None

    def test_get_connections(self):
        """Test getting connections"""
        response = self.run_test(
            "Get Connections",
            "GET",
            "connections",
            200
        )
        return response is not None

    def test_get_pending_requests(self):
        """Test getting pending connection requests"""
        response = self.run_test(
            "Get Pending Requests",
            "GET",
            "connections/pending",
            200
        )
        return response is not None

    def test_update_profile(self):
        """Test updating user profile"""
        update_data = {
            "full_name": "Updated Test User",
            "bio": "Updated bio for testing",
            "location": "Updated Test City"
        }
        
        response = self.run_test(
            "Update Profile",
            "PUT",
            "users/profile",
            200,
            data=update_data
        )
        return response is not None

    def test_get_messages_count(self):
        """Test getting unread messages count"""
        response = self.run_test(
            "Get Unread Messages Count",
            "GET",
            "messages/unread/count",
            200
        )
        return response is not None

    def test_delete_post(self):
        """Test deleting a post"""
        if not hasattr(self, 'test_post_id'):
            return False
            
        response = self.run_test(
            "Delete Post",
            "DELETE",
            f"posts/{self.test_post_id}",
            200
        )
        return response is not None

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Professional Network API Tests")
        print("=" * 50)
        
        # Authentication Tests
        print("\n📝 Testing Authentication...")
        if not self.test_user_registration():
            print("❌ Registration failed, stopping tests")
            return False
            
        if not self.test_user_login():
            print("❌ Login failed, stopping tests")
            return False
            
        self.test_get_current_user()
        
        # Dashboard Tests
        print("\n📊 Testing Dashboard...")
        self.test_dashboard_stats()
        
        # Post Tests
        print("\n📝 Testing Posts...")
        self.test_create_post()
        self.test_get_posts()
        self.test_like_post()
        self.test_comment_on_post()
        
        # User Discovery Tests
        print("\n🔍 Testing User Discovery...")
        self.test_get_users()
        self.test_get_users_with_filter()
        
        # Connection Tests
        print("\n🤝 Testing Connections...")
        self.test_get_connections()
        self.test_get_pending_requests()
        
        # Profile Tests
        print("\n👤 Testing Profile...")
        self.test_update_profile()
        
        # Message Tests
        print("\n💬 Testing Messages...")
        self.test_get_messages_count()
        
        # Cleanup Tests
        print("\n🧹 Testing Cleanup...")
        self.test_delete_post()
        
        # Print Results
        print("\n" + "=" * 50)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            return False

def main():
    tester = ProfNetworkAPITester()
    success = tester.run_all_tests()
    
    # Save detailed results
    results = {
        "timestamp": datetime.now().isoformat(),
        "total_tests": tester.tests_run,
        "passed_tests": tester.tests_passed,
        "success_rate": f"{(tester.tests_passed/tester.tests_run)*100:.1f}%" if tester.tests_run > 0 else "0%",
        "test_details": tester.test_results
    }
    
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())