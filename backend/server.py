from fastapi import FastAPI, APIRouter, HTTPException, Depends, WebSocket, WebSocketDisconnect, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from collections import defaultdict

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_personal_message(self, message: dict, user_id: str):
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].send_json(message)
            except:
                self.disconnect(user_id)

manager = ConnectionManager()

# Models
class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: str
    profession: str
    bio: Optional[str] = ""
    location: Optional[str] = ""

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    username: str
    email: str
    full_name: str
    profession: str
    bio: str
    location: str
    avatar_url: Optional[str] = None
    created_at: str
    connections: List[str] = []
    pending_requests: List[str] = []

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    avatar_url: Optional[str] = None

class Post(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    username: str
    content: str
    created_at: str
    likes: List[str] = []
    comments: List[dict] = []

class PostCreate(BaseModel):
    content: str

class CommentCreate(BaseModel):
    content: str

class ConnectionRequest(BaseModel):
    target_user_id: str

class Message(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    sender_id: str
    receiver_id: str
    content: str
    created_at: str
    read: bool = False

class MessageCreate(BaseModel):
    receiver_id: str
    content: str

# Helper functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        return user_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

# Routes
@api_router.post("/auth/register")
async def register(user_data: UserRegister):
    # Check if user exists
    existing_user = await db.users.find_one({"$or": [{"email": user_data.email}, {"username": user_data.username}]})
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this email or username already exists")
    
    user_dict = {
        "id": str(uuid.uuid4()),
        "username": user_data.username,
        "email": user_data.email,
        "password": hash_password(user_data.password),
        "full_name": user_data.full_name,
        "profession": user_data.profession,
        "bio": user_data.bio,
        "location": user_data.location,
        "avatar_url": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "connections": [],
        "pending_requests": []
    }
    
    await db.users.insert_one(user_dict)
    
    token = create_access_token({"sub": user_dict["id"]})
    return {"token": token, "user": User(**{k: v for k, v in user_dict.items() if k != "password"})}

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_access_token({"sub": user["id"]})
    return {"token": token, "user": User(**{k: v for k, v in user.items() if k != "password"})}

@api_router.get("/auth/me", response_model=User)
async def get_me(user_id: str = Depends(get_current_user)):
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@api_router.put("/users/profile", response_model=User)
async def update_profile(user_update: UserUpdate, user_id: str = Depends(get_current_user)):
    update_data = {k: v for k, v in user_update.model_dump().items() if v is not None}
    if update_data:
        await db.users.update_one({"id": user_id}, {"$set": update_data})
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    return user

@api_router.get("/users/{user_id}", response_model=User)
async def get_user(user_id: str):
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@api_router.get("/users", response_model=List[User])
async def get_users(profession: Optional[str] = None, search: Optional[str] = None, user_id: str = Depends(get_current_user)):
    query = {"id": {"$ne": user_id}}
    if profession:
        query["profession"] = profession
    if search:
        query["$or"] = [
            {"username": {"$regex": search, "$options": "i"}},
            {"full_name": {"$regex": search, "$options": "i"}}
        ]
    
    users = await db.users.find(query, {"_id": 0, "password": 0}).to_list(100)
    return users

# Connection routes
@api_router.post("/connections/request")
async def send_connection_request(request: ConnectionRequest, user_id: str = Depends(get_current_user)):
    target_user = await db.users.find_one({"id": request.target_user_id})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if already connected
    if user_id in target_user.get("connections", []):
        raise HTTPException(status_code=400, detail="Already connected")
    
    # Add to pending requests
    await db.users.update_one(
        {"id": request.target_user_id},
        {"$addToSet": {"pending_requests": user_id}}
    )
    
    return {"message": "Connection request sent"}

@api_router.post("/connections/accept/{requester_id}")
async def accept_connection(requester_id: str, user_id: str = Depends(get_current_user)):
    # Add to both users' connections
    await db.users.update_one(
        {"id": user_id},
        {"$pull": {"pending_requests": requester_id}, "$addToSet": {"connections": requester_id}}
    )
    await db.users.update_one(
        {"id": requester_id},
        {"$addToSet": {"connections": user_id}}
    )
    
    return {"message": "Connection accepted"}

@api_router.post("/connections/reject/{requester_id}")
async def reject_connection(requester_id: str, user_id: str = Depends(get_current_user)):
    await db.users.update_one(
        {"id": user_id},
        {"$pull": {"pending_requests": requester_id}}
    )
    return {"message": "Connection rejected"}

@api_router.get("/connections/pending", response_model=List[User])
async def get_pending_requests(user_id: str = Depends(get_current_user)):
    user = await db.users.find_one({"id": user_id})
    pending_ids = user.get("pending_requests", [])
    
    if not pending_ids:
        return []
    
    users = await db.users.find({"id": {"$in": pending_ids}}, {"_id": 0, "password": 0}).to_list(100)
    return users

@api_router.get("/connections", response_model=List[User])
async def get_connections(user_id: str = Depends(get_current_user)):
    user = await db.users.find_one({"id": user_id})
    connection_ids = user.get("connections", [])
    
    if not connection_ids:
        return []
    
    users = await db.users.find({"id": {"$in": connection_ids}}, {"_id": 0, "password": 0}).to_list(100)
    return users

# Post routes
@api_router.post("/posts", response_model=Post)
async def create_post(post_data: PostCreate, user_id: str = Depends(get_current_user)):
    user = await db.users.find_one({"id": user_id})
    
    post_dict = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "username": user["username"],
        "content": post_data.content,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "likes": [],
        "comments": []
    }
    
    await db.posts.insert_one(post_dict)
    return Post(**post_dict)

@api_router.get("/posts", response_model=List[Post])
async def get_posts(user_id: str = Depends(get_current_user)):
    # Get posts from user and their connections
    user = await db.users.find_one({"id": user_id})
    connection_ids = user.get("connections", []) + [user_id]
    
    posts = await db.posts.find(
        {"user_id": {"$in": connection_ids}},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return posts

@api_router.post("/posts/{post_id}/like")
async def like_post(post_id: str, user_id: str = Depends(get_current_user)):
    post = await db.posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    if user_id in post.get("likes", []):
        await db.posts.update_one({"id": post_id}, {"$pull": {"likes": user_id}})
        return {"message": "Post unliked"}
    else:
        await db.posts.update_one({"id": post_id}, {"$addToSet": {"likes": user_id}})
        return {"message": "Post liked"}

@api_router.post("/posts/{post_id}/comment")
async def comment_on_post(post_id: str, comment_data: CommentCreate, user_id: str = Depends(get_current_user)):
    user = await db.users.find_one({"id": user_id})
    
    comment = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "username": user["username"],
        "content": comment_data.content,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.posts.update_one({"id": post_id}, {"$push": {"comments": comment}})
    return {"message": "Comment added", "comment": comment}

@api_router.delete("/posts/{post_id}")
async def delete_post(post_id: str, user_id: str = Depends(get_current_user)):
    result = await db.posts.delete_one({"id": post_id, "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Post not found or unauthorized")
    return {"message": "Post deleted"}

# Message routes
@api_router.post("/messages", response_model=Message)
async def send_message(message_data: MessageCreate, user_id: str = Depends(get_current_user)):
    message_dict = {
        "id": str(uuid.uuid4()),
        "sender_id": user_id,
        "receiver_id": message_data.receiver_id,
        "content": message_data.content,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "read": False
    }
    
    await db.messages.insert_one(message_dict)
    
    # Send via WebSocket if connected
    await manager.send_personal_message({
        "type": "new_message",
        "message": message_dict
    }, message_data.receiver_id)
    
    return Message(**message_dict)

@api_router.get("/messages/{other_user_id}", response_model=List[Message])
async def get_messages(other_user_id: str, user_id: str = Depends(get_current_user)):
    messages = await db.messages.find(
        {"$or": [
            {"sender_id": user_id, "receiver_id": other_user_id},
            {"sender_id": other_user_id, "receiver_id": user_id}
        ]},
        {"_id": 0}
    ).sort("created_at", 1).to_list(500)
    
    # Mark as read
    await db.messages.update_many(
        {"sender_id": other_user_id, "receiver_id": user_id, "read": False},
        {"$set": {"read": True}}
    )
    
    return messages

@api_router.get("/messages/unread/count")
async def get_unread_count(user_id: str = Depends(get_current_user)):
    count = await db.messages.count_documents({"receiver_id": user_id, "read": False})
    return {"unread_count": count}

# Dashboard stats
@api_router.get("/dashboard/stats")
async def get_dashboard_stats(user_id: str = Depends(get_current_user)):
    user = await db.users.find_one({"id": user_id})
    
    # Get user stats
    total_posts = await db.posts.count_documents({"user_id": user_id})
    total_connections = len(user.get("connections", []))
    pending_requests = len(user.get("pending_requests", []))
    
    # Get post engagement
    user_posts = await db.posts.find({"user_id": user_id}, {"_id": 0}).to_list(1000)
    total_likes = sum(len(post.get("likes", [])) for post in user_posts)
    total_comments = sum(len(post.get("comments", [])) for post in user_posts)
    
    # Get profession stats
    profession_count = await db.users.count_documents({"profession": user["profession"]})
    
    return {
        "total_posts": total_posts,
        "total_connections": total_connections,
        "pending_requests": pending_requests,
        "total_likes": total_likes,
        "total_comments": total_comments,
        "profession_count": profession_count,
        "profession": user["profession"]
    }

# WebSocket endpoint
@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(user_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(user_id)

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()