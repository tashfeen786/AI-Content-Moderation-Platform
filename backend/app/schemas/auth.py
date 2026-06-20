from pydantic import BaseModel, EmailStr

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str  # 'user' ya 'admin'

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse